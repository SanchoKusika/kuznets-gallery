import type { CategoryKey } from "@/content/site";

export const routes = {
  home: "/",
  collection: (category?: CategoryKey | "all") =>
    !category || category === "all" ? "/collection" : `/collection/${category}`,
  work: (slug: string) => `/work/${slug}`,
  info: "/info",
  admin: "/admin",
  /** The 404's pool of works to hang (app/api/hangable). */
  hangable: "/api/hangable",
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
