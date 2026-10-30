import type { MetadataRoute } from "next";
import { CATS } from "@/content/site";
import { getCatalog } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [routes.home, routes.collection(), ...CATS.map((c) => routes.collection(c.k)), routes.info].map((path) => ({ url: SITE_URL + path }));
  // Works with both photos, so they can be found in image search.
  const works = (await getCatalog()).map((p) => ({ url: SITE_URL + routes.work(p.slug), images: [p.flatSrc ?? p.src, p.src].filter((v, i, all) => all.indexOf(v) === i) }));
  return [...pages, ...works];
}
