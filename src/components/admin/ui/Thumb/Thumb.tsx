import Image from "next/image";
import { bem } from "@/lib/bem";
import { imageUrl, isForeign } from "@/lib/images";
import s from "./Thumb.module.scss";

const b = bem(s, "thumb");

type Props = {
  /** Catalogue image (object key or URL); empty → just the paper well. */
  image: string;
  /** Rendered width for the optimiser, e.g. "44px". */
  sizes: string;
  dim?: boolean;
  className?: string;
};

/** Artwork thumbnail in a paper-3 well, cropped to fill (admin lists, cards, drawers). */
export function Thumb({ image, sizes, dim, className }: Props) {
  return <span className={b(null, null, className)}>{image && <Image className={b("img", { dim })} src={imageUrl(image)} alt="" fill sizes={sizes} unoptimized={isForeign(imageUrl(image))} />}</span>;
}
