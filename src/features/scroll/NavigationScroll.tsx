"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { syncScrolledInstantly } from "./header-scroll";

/**
 * After a navigation Next.js scrolls the new page to the top within the commit, but the scroll
 * event comes a frame later — after a view transition has captured the new page with the header
 * still shrunk; right after the morph the header grew and pushed the page down by 19px. Placed
 * after the page in the layout, this layout effect runs after that scroll and sets the header's
 * state on <html> at once, so the captured page already has its final layout.
 */
export function NavigationScroll() {
  const pathname = usePathname();
  useLayoutEffect(syncScrolledInstantly, [pathname]);
  return null;
}
