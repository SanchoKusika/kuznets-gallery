"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTheme } from "@/features/theme/theme";
import { createGalleryMap, type GalleryMap } from "./gallery-map";

/** Within this distance of the viewport the map waits for a pause in scrolling to start. */
const NEAR = "200% 0px";
/** Scrolling counts as paused after this long without a scroll event. */
const CALM_MS = 180;

/**
 * Creates the footer map lazily, follows the site theme and tears the map down on unmount.
 * Starting the API and the WebGL map costs a few dropped frames, so it doesn't happen mid-scroll:
 * once the map is within two screens it starts at the first pause in scrolling, or right away if
 * it scrolls into view first. Without a key or with a failed API load the frame shows the fallback.
 */
export function useGalleryMap(ref: RefObject<HTMLElement | null>, apiKey: string | undefined) {
  const theme = useTheme();
  const themeRef = useRef(theme);
  const mapRef = useRef<GalleryMap | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    themeRef.current = theme;
    mapRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !apiKey) return;
    let cancelled = false;

    let started = false;
    let calmTimer = 0;
    const init = () => {
      if (started || cancelled) return;
      started = true;
      stop();
      createGalleryMap(el, themeRef.current, apiKey)
        .then((map) => {
          if (cancelled) return map.destroy();
          mapRef.current = map;
          map.setTheme(themeRef.current);
        })
        .catch(() => !cancelled && setFailed(true));
    };
    const waitForCalm = () => {
      clearTimeout(calmTimer);
      calmTimer = window.setTimeout(init, CALM_MS);
    };
    const near = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        near.disconnect();
        waitForCalm();
        addEventListener("scroll", waitForCalm, { passive: true });
      },
      { rootMargin: NEAR },
    );
    const visible = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && init());
    const stop = () => {
      near.disconnect();
      visible.disconnect();
      clearTimeout(calmTimer);
      removeEventListener("scroll", waitForCalm);
    };
    near.observe(el);
    visible.observe(el);

    return () => {
      cancelled = true;
      stop();
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [ref, apiKey]);

  return { map: mapRef, failed: failed || !apiKey };
}
