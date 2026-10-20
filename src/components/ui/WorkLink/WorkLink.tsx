"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";

/** How long a link has to stay in view on a touch screen before its page is prefetched. */
const DWELL_MS = 600;

/**
 * Link to an artwork page. A plain <Link> prefetches only the shared App Shell, so the page itself
 * came over the network after the click (≈1 s from Tashkent). Once the visitor shows intent the
 * whole page is prefetched (static, from the CDN cache) and the click opens it at once. Intent is a
 * pointer over the link, a touch or focus; touch screens have no hover, so there it is the link
 * staying in view for a moment. Prefetching every card that passes by would cost ~10 KB each.
 */
export function WorkLink({ onPointerEnter, onTouchStart, onFocus, ...props }: ComponentProps<typeof Link>) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [intent, setIntent] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (intent || !el || matchMedia("(hover: hover)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        clearTimeout(timer);
        if (e.isIntersecting) timer = window.setTimeout(() => setIntent(true), DWELL_MS);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [intent]);

  return (
    <Link
      {...props}
      ref={ref}
      prefetch={intent ? true : "auto"}
      onPointerEnter={(e) => {
        setIntent(true);
        onPointerEnter?.(e);
      }}
      onTouchStart={(e) => {
        setIntent(true);
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        setIntent(true);
        onFocus?.(e);
      }}
    />
  );
}
