import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

/** Radius that covers the whole frame from a point. */
export const coverRadius = (x: number, y: number, w: number, h: number) =>
  Math.hypot(Math.max(x, w - x), Math.max(y, h - y));

/**
 * Circle from a point (transition 2, like the site's theme switch): children are visible inside a
 * circle of `radius` around (x, y). Animate `radius` from 0 to coverRadius() (reveal) or back (collapse).
 */
export function CircleReveal({ x, y, radius, children, style }: { x: number; y: number; radius: number; children: ReactNode; style?: CSSProperties }) {
  const { width, height } = useVideoConfig();
  if (radius <= 0) return null;
  const full = radius >= coverRadius(x, y, width, height);
  return <AbsoluteFill style={{ clipPath: full ? undefined : `circle(${radius}px at ${x}px ${y}px)`, ...style }}>{children}</AbsoluteFill>;
}
