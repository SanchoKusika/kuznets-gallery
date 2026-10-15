import type { MetadataRoute } from "next";
import { INDEXABLE, SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: INDEXABLE ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] } : { userAgent: "*", disallow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
