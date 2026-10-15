import type { ButtonHTMLAttributes } from "react";
import { bem } from "@/lib/bem";
import s from "./DsButton.module.scss";

const b = bem(s, "ds-button");

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  block?: boolean;
};

/** The design system's pill button used by the admin (`KuznetsovsGalleryDesignSystem.Button`). */
export function DsButton({ variant = "primary", size = "md", block, className, type = "button", ...rest }: Props) {
  return <button type={type} className={b(null, { [variant]: true, [size]: true, block }, className)} {...rest} />;
}
