import Image from "next/image";
import logo from "@/assets/logo.png";
import s from "./Logo.module.scss";

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
      className={className ? `${s.logo} ${className}` : s.logo}
    />
  );
}
