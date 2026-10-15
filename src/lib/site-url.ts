const PRODUCTION_URL = "https://kuznets.uz";

/** Public origin of the site: sitemap, robots, canonical URLs (metadataBase). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL).replace(/\/$/, "");

/** Only the real domain is indexed; a preview (workers.dev) answers robots with Disallow and noindex. */
export const INDEXABLE = SITE_URL === PRODUCTION_URL;
