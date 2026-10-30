import type { MetadataRoute } from "next";
import { CATS } from "@/content/site";
import { getCatalog, type Artwork } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [routes.home, routes.collection(), ...CATS.map((c) => routes.collection(c.k)), routes.info].map((path) => ({ url: SITE_URL + path }));
  // Works with both photos, so they can be found in image search. Next writes image URLs into the XML as they are:
  // only absolute ones, with `&` escaped.
  const images = (p: Artwork) =>
    [...new Set([p.flatSrc ?? p.src, p.src])].filter((u) => /^https?:/.test(u)).map((u) => u.replace(/&/g, "&amp;"));
  const works = (await getCatalog()).map((p) => ({ url: SITE_URL + routes.work(p.slug), images: images(p) }));
  return [...pages, ...works];
}
