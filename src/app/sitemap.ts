import type { MetadataRoute } from "next";
import { CATS } from "@/content/site";
import { getCatalog } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    routes.home,
    routes.collection(),
    ...CATS.map((c) => routes.collection(c.k)),
    routes.info,
    ...getCatalog().map((p) => routes.work(p.slug)),
  ];
  return paths.map((path) => ({ url: SITE_URL + path }));
}
