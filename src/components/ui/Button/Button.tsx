import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon/Icon";
import { bem } from "@/lib/bem";
import s from "./Button.module.scss";

const b = bem(s, "button");

type Common = {
  /** primary — ink fill, accent on hover; outline — ink border, ink fill on hover. */
  variant?: "primary" | "outline";
  /** md — 14px / 14×24; lg — 15px / 18×30. */
  size?: "md" | "lg";
  /** Weight 400 instead of 500 (some prototype buttons don't set a weight). */
  regular?: boolean;
  /** Full width with centred content. */
  block?: boolean;
  icon?: IconName;
  iconSize?: number;
  /** Icon after the label (forward actions) instead of before it. */
  iconEnd?: boolean;
  className?: string;
  children: ReactNode;
};

type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Common | "href">;
export type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>;

/** Pill button / link from the prototype. Internal hrefs render a Next <Link>. */
export function Button(props: AsLink | AsButton) {
  const {
    variant = "primary",
    size = "md",
    regular,
    block,
    icon,
    iconSize = 16,
    iconEnd,
    className,
    children,
    ...rest
  } = props;
  const cls = b(null, { [variant]: true, [size]: true, regular, block }, className);
  const glyph = icon && <Icon name={icon} size={iconSize} />;
  const inner = (
    <span className={b("inner")}>
      {!iconEnd && glyph}
      {children}
      {iconEnd && glyph}
    </span>
  );

  if (rest.href !== undefined) {
    const { href, ...anchor } = rest as AsLink;
    return href.startsWith("/") ? (
      <Link href={href} className={cls} {...anchor}>
        {inner}
      </Link>
    ) : (
      <a href={href} className={cls} {...anchor}>
        {inner}
      </a>
    );
  }

  const { type = "button", ...button } = rest as AsButton;
  return (
    <button type={type} className={cls} {...button}>
      {inner}
    </button>
  );
}
