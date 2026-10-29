import Image, { type StaticImageData } from "next/image";
import type { Ref } from "react";
import { bem } from "@/lib/bem";
import { isForeign } from "@/lib/images";
import s from "./Media.module.scss";

const b = bem(s, "media");

type Props = {
  src: string | StaticImageData;
  alt?: string;
  /** Rendered width hint for the srcset. */
  sizes: string;
  /** Wrapper class: aspect ratio, background, etc. */
  className?: string;
  /** Image class: hover zoom (`@include zoom(...)`), fit, etc. */
  imgClassName?: string;
  eager?: boolean;
  /** Already loaded picture shown under the image until it loads (gets `imgClassName` too). */
  placeholder?: string;
  /** The image has loaded (client components only). */
  onLoad?: () => void;
  /** The wrapper element. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Image well (prototype: overflow-hidden box on paper-3 with a covering image,
 * dimmed in dark theme). Remote catalogue images get a nominal intrinsic size;
 * the box defines the real one.
 */
export function Media({ src, alt = "", sizes, className, imgClassName, eager, placeholder, onLoad, ref }: Props) {
  const dims = typeof src === "string" ? { width: 1200, height: 1200 } : {};
  return (
    <div ref={ref} className={b(null, null, className)}>
      {placeholder && (
        // eslint-disable-next-line @next/next/no-img-element -- a file the browser already has, as is
        <img src={placeholder} alt="" aria-hidden className={b("placeholder", null, imgClassName)} />
      )}
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        onLoad={onLoad}
        className={b("img", null, imgClassName)}
        unoptimized={typeof src === "string" && isForeign(src)}
        {...dims}
      />
    </div>
  );
}
