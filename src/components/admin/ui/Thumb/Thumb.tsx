"use client";

import Image from "next/image";
import { useState } from "react";
import { bem } from "@/lib/bem";
import { imageUrl, isForeign } from "@/lib/images";
import s from "./Thumb.module.scss";

const b = bem(s, "thumb");

type Props = {
  /** Catalogue image (object key or URL); empty → just the paper well. */
  image: string;
  /** Rendered width for the image loader's pick, e.g. "44px". */
  sizes: string;
  dim?: boolean;
  className?: string;
};

/**
 * Artwork thumbnail in a paper-3 well, cropped to fill (admin lists, cards, drawers). A photo whose WebP copies
 * are not there yet (a path just typed and saved) falls back to the file itself.
 */
export function Thumb({ image, sizes, dim, className }: Props) {
  const src = image ? imageUrl(image) : "";
  const [raw, setRaw] = useState<string | null>(null);
  return (
    <span className={b(null, null, className)}>
      {src && <Image className={b("img", { dim })} src={src} alt="" fill sizes={sizes} unoptimized={raw === src || isForeign(src)} onError={() => setRaw(src)} />}
    </span>
  );
}
