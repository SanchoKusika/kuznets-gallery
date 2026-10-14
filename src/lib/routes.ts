import type { CategoryKey } from "@/content/site";

export const routes = {
  home: "/",
  collection: (category?: CategoryKey | "all") =>
    !category || category === "all" ? "/collection" : `/collection/${category}`,
  work: (slug: string) => `/work/${slug}`,
  info: "/info",
  admin: "/admin",
} as const;

export type Section = "home" | "catalog" | "work" | "info" | null;

/** Prototype "page" for a pathname: drives active states in the header and menu. */
export function sectionOf(pathname: string): Section {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/collection")) return "catalog";
  if (pathname.startsWith("/work")) return "work";
  if (pathname.startsWith("/info")) return "info";
  return null;
}

/** "Контакты": smooth-scroll to the footer (prototype: 60ms after closing the menu). */
export function scrollToContacts() {
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 60);
}
