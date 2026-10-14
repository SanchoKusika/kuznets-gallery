/**
 * Base URL for catalogue images. They are served from the current WordPress site for now;
 * once the originals move to our own storage, change NEXT_PUBLIC_IMAGE_BASE
 * (and add the new host to `images.remotePatterns` in next.config.ts).
 */
export const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE ?? "https://kuznets.uz/wp-content/uploads/";

/** Same rule as the prototype: absolute, data: and local asset paths pass through. */
export function imageUrl(path: string) {
  return /^(https?:|data:|\/)/.test(path) ? path : IMAGE_BASE + path;
}
