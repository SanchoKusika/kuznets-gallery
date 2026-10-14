/**
 * Base URL for catalogue images. They are served from the current WordPress site for now;
 * once the originals move to our own storage, change NEXT_PUBLIC_IMAGE_BASE
 * (and add the new host to `images.remotePatterns` in next.config.ts).
 */
export const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE ?? "https://kuznets.uz/wp-content/uploads/";

/**
 * Prototype rule: absolute URLs, data: URIs and local assets pass through; anything else
 * is a path inside the uploads folder. The prototype's relative `assets/…` maps to `/assets/…`.
 */
export function imageUrl(path: string) {
  if (/^(https?:|data:|\/)/.test(path)) return path;
  if (path.startsWith("assets/")) return "/" + path;
  return IMAGE_BASE + path;
}
