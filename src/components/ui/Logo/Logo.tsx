"use client";

import { useRef } from "react";
import { bem } from "@/lib/bem";
import s from "./Logo.module.scss";
import { LOGO_PATHS } from "./logo-paths";
import { useLogoEye } from "./use-logo-eye";

const b = bem(s, "logo");

/** Index of the «O» among the letters. */
const O = 7;

/**
 * Brand logo as vector parts (same canvas as the old 499×192 PNG, so heights stay as they were).
 * Colours come from theme tokens. `live` — the header logo: it builds itself on the first page of a
 * visit, and the dot in the «O» follows the mouse. Height comes from the parent's class.
 */
export function Logo({ className, live = false }: { className?: string; live?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useLogoEye(ref, live);

  return (
    <svg ref={ref} className={b(null, { live }, className)} viewBox="0 0 499 192" fillRule="evenodd" role="img" aria-label="Kuznetsovs Gallery">
      <path className={b("wave")} d={LOGO_PATHS.wave} />
      {LOGO_PATHS.beads.map((d) => (
        <path key={d} className={b("bead")} d={d} />
      ))}
      <svg className={b("row")} x={0} y={31} width={499} height={80} viewBox="0 31 499 80">
        {LOGO_PATHS.letters.map((d, i) => (
          <path key={d} className={b("letter")} d={d} data-logo-o={i === O || undefined} />
        ))}
        <path className={b("dot")} d={LOGO_PATHS.dot} data-logo-dot />
      </svg>
      <g>
        {LOGO_PATHS.gallery.map((d) => (
          <path key={d} className={b("gallery")} d={d} />
        ))}
      </g>
    </svg>
  );
}
