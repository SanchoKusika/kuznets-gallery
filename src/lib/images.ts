/**
 * Base URL for catalogue images: the public `artworks` bucket in Supabase Storage. The database keeps
 * object keys (the old WordPress upload paths, e.g. "2021/04/KUZNETSOVS-UZBJUDD.jpg"), so moving the files
 * elsewhere means changing NEXT_PUBLIC_IMAGE_BASE (and copying `_v/` along: see VARIANT_WIDTHS).
 */
export const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE ?? "https://jagdvpeddgzyyqhjliav.supabase.co/storage/v1/object/public/artworks/";

/**
 * A link to another host (the admin may paste one instead of a path): only bucket images have
 * WebP copies, so such images are shown as they are (`unoptimized`).
 */
export const isForeign = (url: string) => /^https?:/.test(url) && !url.startsWith(IMAGE_BASE);

/** Absolute URLs, data: URIs and root paths pass through; anything else is an object key in the bucket. */
export function imageUrl(path: string) {
  return /^(https?:|data:|\/)/.test(path) ? path : IMAGE_BASE + path;
}

/**
 * Widths of the WebP copies kept beside every image in the bucket, at `_v/<width>/<key without extension>.webp`
 * (made by the admin panel on upload and by scripts/db/variants.mjs). The site's image loader picks one of them,
 * so no image optimiser is needed: neither Vercel's nor one on Cloudflare.
 */
export const VARIANT_WIDTHS = [256, 640, 1200, 2048] as const;

/** Folder of the copies: everything under it is generated. */
export const VARIANT_DIR = "_v/";

export const variantKey = (key: string, width: number) => `${VARIANT_DIR}${width}/${key.replace(/\.[^./]+$/, "")}.webp`;

/** Object key of a bucket image (a key or its URL); null for links elsewhere, data: URIs and the site's own files. */
export function bucketKey(path: string) {
  if (path.startsWith(IMAGE_BASE)) return path.slice(IMAGE_BASE.length);
  return !path || /^(https?:|data:|\/)/.test(path) ? null : path;
}
