import type { CSSProperties } from "react";
import { color } from "../theme/tokens";

/** The accent dot: the «O» dot of the logo and the site's cursor. Centred on (x, y), diameter `d`. */
export function DotCursor({ x, y, d, fill = color.accent, style }: { x: number; y: number; d: number; fill?: string; style?: CSSProperties }) {
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
        ...style,
      }}
    />
  );
}
