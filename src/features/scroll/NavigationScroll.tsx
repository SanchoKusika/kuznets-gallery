"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { trackNavigation } from "@/features/catalog/return-to-collection";
import { syncScrolledInstantly } from "./header-scroll";

/**
 * After a navigation Next.js scrolls the new page to the top within the commit, but the scroll
 * event comes a frame later — after a view transition has captured the new page with the header
 * still shrunk; right after the morph the header grew and pushed the page down by 19px. Placed
 * after the page in the layout, this layout effect runs after that scroll and sets the header's
 * state on <html> at once, so the captured page already has its final layout. It also lets «←
 * Коллекция» know where the visitor went (return-to-collection.ts).
 */
export function NavigationScroll() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    syncScrolledInstantly();
    trackNavigation(pathname);
  }, [pathname]);
  return null;
}
