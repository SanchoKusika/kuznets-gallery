const PRODUCTION_URL = "https://kuznets.uz";
// On Vercel the project's production domain (*.vercel.app until kuznets.uz is attached), in previews too.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const configured = (process.env.NEXT_PUBLIC_SITE_URL || (vercel && `https://${vercel}`))?.replace(/\/$/, "");

/** Public origin of the site: sitemap, robots, canonical URLs (metadataBase). */
export const SITE_URL = configured || PRODUCTION_URL;

/**
 * Indexed only in a production build for the real domain: a demo (*.vercel.app), a PR preview or a local build
 * without NEXT_PUBLIC_SITE_URL answers robots with Disallow and noindex.
 */
export const INDEXABLE = configured === PRODUCTION_URL && process.env.VERCEL_ENV !== "preview";
