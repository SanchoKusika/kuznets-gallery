import type { CSSProperties, ReactNode } from "react";
import { fonts } from "../theme/fonts";
import { color } from "../theme/tokens";

/** Hero plate of the site: pill, accent dot, Onest 500 (brief 7, R2). */
export function Chip({ children, size = 26, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.5,
        padding: `${size * 0.42}px ${size * 0.8}px`,
        borderRadius: 99 * (size / 12),
        background: "rgba(242,239,233,.94)",
        boxShadow: "0 0 0 1px rgba(21,21,21,.12)",
        fontFamily: fonts.sans,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
        color: color.ink,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: "50%", background: color.accent, flex: "none" }} />
      {children}
    </div>
  );
}

/** Accent pill button (CTA): Onest 500, on-accent text. */
export function Pill({ children, size = 30, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-block",
        padding: `${size * 0.82}px ${size * 1.4}px`,
        borderRadius: 999,
        background: color.accent,
        color: color.onAccent,
        fontFamily: fonts.sans,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
