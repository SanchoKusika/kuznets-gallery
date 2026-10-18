import { useVideoConfig } from "remotion";
import { color, stroke } from "../theme/tokens";

type Pt = { x: number; y: number };

/** Picture wire on screen: a little thinner than the drawings, ink-2. */
export const WIRE = { color: color.ink2, width: stroke.reels * 0.8 } as const;

/** Radius of the nail's shank the wire wraps over (hidden under the head). */
export const NAIL_SHANK = 3;

/**
 * Rings on the back of a w×h canvas the wire is tied to, relative to the canvas's top-centre: a real picture wire
 * runs between two D-rings a little below the top edge, so above the canvas only the Λ to the nail is seen.
 */
export const wireRings = (w: number, h: number) => ({ dx: w / 2 - Math.min(0.12 * w, 90), dy: Math.min(0.18 * h, 120) });

/**
 * Nail on the wall: the accent dot of R1 become its head, with a soft contact shadow cast down-right (the window
 * light comes from the upper left). `shadow` fades the shadow in while the dot lands.
 */
export function Nail({ x, y, head = 18, shadow = 1 }: { x: number; y: number; head?: number; shadow?: number }) {
  const r = head / 2;
  return (
    <>
      {shadow > 0 ? (
        <div
          style={{
            position: "absolute",
            left: x - r + r * 0.25,
            top: y - r + r * 0.45,
            width: head,
            height: head,
            borderRadius: "50%",
            background: "rgba(21,21,21,.32)",
            filter: `blur(${(r * 0.45).toFixed(2)}px)`,
            opacity: shadow,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: head,
          height: head,
          borderRadius: "50%",
          background: color.accent,
          // A touch of volume (darker away from the window), so the head reads as a nail, not a sticker.
          boxShadow: `inset ${(-r * 0.2).toFixed(2)}px ${(-r * 0.3).toFixed(2)}px ${(r * 0.5).toFixed(2)}px rgba(21,21,21,.22)`,
        }}
      />
    </>
  );
}

/** A wire through points, smoothed: quadratic curves through the midpoints, so the polyline of the simulation never shows its joints. */
export function wireD(pts: Pt[]) {
  if (pts.length < 2) return "";
  const f = (p: Pt) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  let d = `M${f(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const m = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
    d += `Q${f(pts[i])} ${f(m)}`;
  }
  return `${d}L${f(pts[pts.length - 1])}`;
}

/** The wire as an SVG over the whole frame (draw it behind the canvas: the canvas hides its lower ends). */
export function WireLine({ points, opacity = 1 }: { points: Pt[]; opacity?: number }) {
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
      <path d={wireD(points)} fill="none" stroke={WIRE.color} strokeWidth={WIRE.width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A still canvas's wire (cover, styleframes): taut from the rings over the nail, the canvas turned by `angle` (deg)
 * about the nail. Mount it before the canvas.
 */
export function PictureWire({ nail, frame, angle = 0 }: { nail: Pt; frame: { x: number; y: number; w: number; h: number }; angle?: number }) {
  const { dx, dy } = wireRings(frame.w, frame.h);
  const a = (angle * Math.PI) / 180;
  const rot = (p: Pt) => ({
    x: nail.x + (p.x - nail.x) * Math.cos(a) - (p.y - nail.y) * Math.sin(a),
    y: nail.y + (p.x - nail.x) * Math.sin(a) + (p.y - nail.y) * Math.cos(a),
  });
  const cx = frame.x + frame.w / 2;
  return <WireLine points={[rot({ x: cx - dx, y: frame.y + dy }), nail, rot({ x: cx + dx, y: frame.y + dy })]} />;
}
