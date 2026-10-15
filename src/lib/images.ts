/**
 * Base URL for catalogue images: the public `artworks` bucket in Supabase Storage. The database keeps
 * object keys (the old WordPress upload paths, e.g. "2021/04/KUZNETSOVS-UZBJUDD.jpg"), so moving the files
 * elsewhere means changing NEXT_PUBLIC_IMAGE_BASE (`images.remotePatterns` follows it).
 */
export const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE ?? "https://jagdvpeddgzyyqhjliav.supabase.co/storage/v1/object/public/artworks/";

/**
 * A link to another host (the admin may paste one instead of a path): next/image only optimises
 * the bucket, so such images are shown as they are.
 */
export const isForeign = (url: string) => /^https?:/.test(url) && !url.startsWith(IMAGE_BASE);

/** Absolute URLs, data: URIs and root paths pass through; anything else is an object key in the bucket. */
export function imageUrl(path: string) {
  return /^(https?:|data:|\/)/.test(path) ? path : IMAGE_BASE + path;
}
