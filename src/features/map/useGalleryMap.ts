"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTheme } from "@/features/theme/theme";
import { createGalleryMap, loadYmaps, type GalleryMap } from "./gallery-map";

/** Within this distance of the viewport the API script is fetched ahead, at a pause in scrolling. */
const NEAR = "300% 0px";
/** Scrolling counts as paused after this long without a scroll event. */
const CALM_MS = 180;
/** The scheme draws its tiles over a few frames after the map is created; reveal it after that. */
const SETTLE_MS = 350;

/**
 * Creates the footer map lazily, follows the site theme and tears the map down on unmount.
 * Starting the Yandex API and drawing the WebGL map drops frames, so none of it runs mid-scroll:
 * within three screens the script loads at the first pause in scrolling, and the map itself is
 * created once it is on screen and scrolling has stopped. Until then — and while its tiles settle —
 * the frame shows `<MapPlaceholder>`; `ready` turns true when the map can fade in over it.
 * Without a key or with a failed API load the frame shows the fallback.
 */
export function useGalleryMap(ref: RefObject<HTMLElement | null>, apiKey: string | undefined) {
  const theme = useTheme();
  const themeRef = useRef(theme);
  const mapRef = useRef<GalleryMap | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    themeRef.current = theme;
    mapRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !apiKey) return;
    let cancelled = false;
    let near = false;
    let visible = false;
    let preloading = false;
    let started = false;
    let timer = 0;

    const start = () => {
      if (started || cancelled) return;
      started = true;
      stop();
      createGalleryMap(el, themeRef.current, apiKey)
        .then((map) => {
          if (cancelled) return map.destroy();
          mapRef.current = map;
          map.setTheme(themeRef.current);
          timer = window.setTimeout(() => !cancelled && setReady(true), SETTLE_MS);
        })
        .catch(() => !cancelled && setFailed(true));
    };
    // A pause in scrolling: create the map if it's on screen, otherwise just fetch the script.
    const onCalm = () => {
      if (visible) start();
      else if (near && !preloading) {
        preloading = true;
        loadYmaps(apiKey).catch(() => {});
      }
    };
    const arm = () => {
      if (!near && !visible) return;
      clearTimeout(timer);
      timer = window.setTimeout(onCalm, CALM_MS);
    };
    const watch = (rootMargin?: string) =>
      new IntersectionObserver(
        (es) => {
          // Entries can queue up; the last one is the current state.
          const on = es[es.length - 1].isIntersecting;
          if (rootMargin) near = on;
          else visible = on;
          arm();
        },
        { rootMargin },
      );
    const nearIO = watch(NEAR);
    const visibleIO = watch();
    const stop = () => {
      nearIO.disconnect();
      visibleIO.disconnect();
      clearTimeout(timer);
      removeEventListener("scroll", arm);
    };
    nearIO.observe(el);
    visibleIO.observe(el);
    addEventListener("scroll", arm, { passive: true });

    return () => {
      cancelled = true;
      stop();
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [ref, apiKey]);

  return { map: mapRef, failed: failed || !apiKey, ready };
}
