"use client";

import { IMAGE_BASE, VARIANT_WIDTHS, variantKey } from "./images";

/**
 * next/image loader (next.config `images.loaderFile`): a bucket image is served as its WebP copy of the
 * nearest width up (lib/images.ts). The site's own files (`/_next/static/…`, `/assets/…`) go as they are;
 * the width in the query only keeps next/image from warning that the loader ignores it.
 */
export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith(IMAGE_BASE)) return `${src}?w=${width}`;
  const w = VARIANT_WIDTHS.find((v) => v >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
  return IMAGE_BASE + variantKey(src.slice(IMAGE_BASE.length), w);
}
