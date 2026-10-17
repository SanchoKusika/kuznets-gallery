import type { CSSProperties } from "react";
import { fonts } from "../theme/fonts";
import { color } from "../theme/tokens";

/**
 * The accent dot: the «O» dot of the logo and the site's cursor. Centred on (x, y), diameter `d`.
 * With `label` (P3 hover «смотреть») the text fades in with `labelOpacity`.
 */
export function DotCursor({
  x,
  y,
  d,
  label,
  labelOpacity = 1,
  fill = color.accent,
  style,
}: {
  x: number;
  y: number;
  d: number;
  label?: string;
  labelOpacity?: number;
  fill?: string;
  style?: CSSProperties;
}) {
  if (d <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - d / 2,
        top: y - d / 2,
        width: d,
        height: d,
        borderRadius: "50%",
        background: fill,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {label ? (
        <span style={{ fontFamily: fonts.sans, fontWeight: 500, fontSize: 18, color: color.onAccent, opacity: labelOpacity, letterSpacing: "-0.01em" }}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
