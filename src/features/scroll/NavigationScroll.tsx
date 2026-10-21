"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { trackNavigation } from "@/features/catalog/return-to-collection";
import { syncScrolledInstantly } from "./header-scroll";

/**
 * After a navigation Next.js scrolls the new page to the top within the commit, but the scroll
 * event comes a frame later: the new page showed up with the header still shrunk, which then grew
 * and slid the page down by 19px. Placed after the page in the layout, this layout effect runs
 * after that scroll and sets the header's state on <html> at once, without its transition. It
 * also lets «← Коллекция» know where the visitor went and puts them back where they were in the
 * collection (return-to-collection.ts).
 */
export function NavigationScroll() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    trackNavigation(pathname);
    syncScrolledInstantly();
  }, [pathname]);
  return null;
}
