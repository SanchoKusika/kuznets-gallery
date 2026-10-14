import Image from "next/image";
import logo from "@/assets/logo.png";
import { bem } from "@/lib/bem";
import s from "./Logo.module.scss";

const b = bem(s, "logo");

/**
 * Brand logo (499×192 PNG, 28 KB). Multiplied onto paper in light theme,
 * inverted + screen-blended in dark. Height comes from the parent's class.
 * Served as-is: resized variants round the height and shift the aspect ratio.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt="Kuznetsovs Gallery"
      unoptimized
      loading="eager"
      className={b(null, null, className)}
    />
  );
}
