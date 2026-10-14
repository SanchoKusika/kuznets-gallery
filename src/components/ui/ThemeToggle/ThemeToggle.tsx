"use client";

import { useId, type MouseEvent } from "react";
import { bem } from "@/lib/bem";
import { toggleTheme, useTheme } from "@/features/theme/theme";
import s from "./ThemeToggle.module.scss";

const b = bem(s, "theme-toggle");

type Variant = "scene" | "icon";

/**
 * Theme switch from the prototype. Visual state is driven by `[data-theme]` in CSS,
 * so it is correct before hydration; React state only feeds ARIA.
 * Variants in use: `scene` (site, admin sidebar/top bar) and `icon` (admin rail).
 */
export function ThemeToggle({ variant = "scene" }: { variant?: Variant }) {
  const dark = useTheme() === "dark";
  const maskId = "kztt" + useId().replace(/[^\w-]/g, "");
  const label = dark ? "Включить светлую тему" : "Включить тёмную тему";

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    let { clientX, clientY } = e;
    if (!clientX && !clientY) {
      const r = e.currentTarget.getBoundingClientRect();
      clientX = r.left + r.width / 2;
      clientY = r.top + r.height / 2;
    }
    toggleTheme({ clientX, clientY });
  };

  const common = {
    type: "button" as const,
    role: "switch",
    "aria-checked": dark,
    "aria-label": label,
    title: label,
    onClick,
  };

  if (variant === "icon") {
    return (
      <button {...common} className={b(null, { icon: true })}>
        <svg className={b("glyph")} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <mask id={maskId}>
            <rect x="-4" y="-4" width="32" height="32" fill="#fff" />
            <circle className={b("mask-dot")} cx="17.5" cy="6.5" r="7" fill="#000" />
          </mask>
          <circle className={b("core")} cx="12" cy="12" r="8.5" fill="currentColor" mask={`url(#${maskId})`} />
          <g className={b("rays")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 1.6v2.2M12 20.2v2.2M1.6 12h2.2M20.2 12h2.2M4.65 4.65l1.55 1.55M17.8 17.8l1.55 1.55M4.65 19.35l1.55-1.55M17.8 6.2l1.55-1.55" />
          </g>
        </svg>
      </button>
    );
  }

  return (
    <button {...common} className={b(null, { scene: true })}>
      <svg className={b("sky", { stars: true })} width="56" height="30" viewBox="0 0 70 38" preserveAspectRatio="none" aria-hidden="true">
        <path d="M11 7.5l.9 2.7 2.7.9-2.7.9-.9 2.7-.9-2.7-2.7-.9 2.7-.9z" fill="#fff" />
        <path d="M24.5 20.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z" fill="#fff" opacity=".9" />
        <circle cx="20" cy="8.5" r=".9" fill="#fff" />
        <circle cx="6.5" cy="21" r="1.1" fill="#fff" opacity=".85" />
        <circle cx="14.5" cy="28" r=".8" fill="#fff" opacity=".7" />
        <circle cx="28.5" cy="11.5" r=".7" fill="#fff" opacity=".6" />
        <circle cx="30.5" cy="30" r=".9" fill="#fff" opacity=".75" />
        <circle cx="16.5" cy="17.5" r=".6" fill="#fff" opacity=".6" />
      </svg>
      <svg className={b("sky", { clouds: true })} width="56" height="30" viewBox="0 0 70 38" preserveAspectRatio="none" aria-hidden="true">
        <g fill="#fff" opacity=".55">
          <circle cx="46" cy="30" r="7" />
          <circle cx="55" cy="25" r="8" />
          <circle cx="65" cy="24" r="9" />
          <circle cx="75" cy="20" r="10" />
        </g>
        <g fill="#fff">
          <circle cx="41" cy="37" r="7" />
          <circle cx="50" cy="33.5" r="7.5" />
          <circle cx="60" cy="32" r="8" />
          <circle cx="70" cy="29" r="9" />
        </g>
      </svg>
      <span className={b("knob")}>
        <span className={b("moon")}>
          <span className={b("crater", { n: 1 })} />
          <span className={b("crater", { n: 2 })} />
          <span className={b("crater", { n: 3 })} />
        </span>
      </span>
    </button>
  );
}
