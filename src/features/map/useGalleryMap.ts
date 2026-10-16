"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTheme } from "@/features/theme/theme";
import { createGalleryMap, type GalleryMap } from "./gallery-map";

/**
 * Creates the footer map once its container comes within 600px of the viewport (MapLibre and
 * the tiles are heavy), follows the site theme and tears the map down on unmount.
 */
export function useGalleryMap(ref: RefObject<HTMLElement | null>) {
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
    if (!el) return;
    let cancelled = false;

    const init = () => {
      io.disconnect();
      createGalleryMap(el, themeRef.current)
        .then((map) => {
          if (cancelled) return map.destroy();
          mapRef.current = map;
          map.setTheme(themeRef.current);
        })
        .catch(() => !cancelled && setFailed(true));
    };
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && init(), { rootMargin: "600px" });
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [ref]);

  return { map: mapRef, failed };
}
