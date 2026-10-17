import type { CSSProperties } from "react";
import { ArtImage } from "../primitives/ArtImage";
import { color, shadow } from "../theme/tokens";

/**
 * Baguette around a canvas (P7, column 2): four ink bars, 28 px, mitred corners, a thin bevel line.
 * `bars` — progress 0…1 of each bar sliding in from its side (top, right, bottom, left); at 1 it
 * clicks into the corner.
 */
export function BagetFrame({
  code,
  w,
  h,
  bar = 28,
  bars = [1, 1, 1, 1],
  travel = 220,
  style,
}: {
  code: string;
  w: number;
  h: number;
  bar?: number;
  bars?: readonly [number, number, number, number] | number[];
  /** Distance a bar slides in from, px. */
  travel?: number;
  style?: CSSProperties;
}) {
  const W = w + 2 * bar;
  const H = h + 2 * bar;
  const bevel = bar * 0.42;
  // Bars in frame coordinates (origin = outer top-left), each a trapezoid with its bevel line.
  const polys = [
    { pts: `0,0 ${W},0 ${W - bar},${bar} ${bar},${bar}`, line: `M${bevel},${bevel}L${W - bevel},${bevel}`, dx: 0, dy: -1 },
    { pts: `${W},0 ${W},${H} ${W - bar},${H - bar} ${W - bar},${bar}`, line: `M${W - bevel},${bevel}L${W - bevel},${H - bevel}`, dx: 1, dy: 0 },
    { pts: `${W},${H} 0,${H} ${bar},${H - bar} ${W - bar},${H - bar}`, line: `M${W - bevel},${H - bevel}L${bevel},${H - bevel}`, dx: 0, dy: 1 },
    { pts: `0,${H} 0,0 ${bar},${bar} ${bar},${H - bar}`, line: `M${bevel},${H - bevel}L${bevel},${bevel}`, dx: -1, dy: 0 },
  ];
  const all = bars.every((b) => b >= 1);
  return (
    <div style={{ position: "relative", width: W, height: H, ...style }}>
      <div style={{ position: "absolute", left: bar, top: bar, boxShadow: all ? shadow.float(W / 600) : undefined }}>
        <ArtImage code={code} width={w} height={h} />
      </div>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {polys.map((p, i) => {
          const t = Math.max(0, Math.min(1, bars[i]));
          if (t <= 0) return null;
          const off = (1 - t) * travel;
          return (
            <g key={i} transform={`translate(${p.dx * off} ${p.dy * off})`} opacity={Math.min(1, t * 3)}>
              <polygon points={p.pts} fill={color.ink} />
              <path d={p.line} stroke="rgba(242,239,233,.28)" strokeWidth={1.2} fill="none" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Paper print under glass (P7, column 3): light thin frame, paper-raised mat, the print inside;
 * `glint` 0…1 moves a diagonal white 15% highlight across the glass.
 */
export function GlassFrame({
  code,
  w,
  h,
  frame = 12,
  mat = 46,
  glint = 0,
  style,
}: {
  code: string;
  /** Outer size. */
  w: number;
  h: number;
  frame?: number;
  mat?: number;
  glint?: number;
  style?: CSSProperties;
}) {
  const iw = w - 2 * (frame + mat);
  const ih = h - 2 * (frame + mat);
  const band = 0.22;
  const pos = -band + glint * (1 + 2 * band);
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        background: color.paper3,
        boxShadow: `${shadow.float(w / 600)}, inset 0 0 0 1.5px ${color.ink2}`,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: frame, background: color.paperRaised, boxShadow: `inset 0 0 0 1px rgba(21,21,21,.18)` }} />
      <div style={{ position: "absolute", left: frame + mat, top: frame + mat, boxShadow: "inset 0 0 0 1px rgba(21,21,21,.12)" }}>
        <ArtImage code={code} width={iw} height={ih} />
      </div>
      {glint > 0 && glint < 1 ? (
        <div
          style={{
            position: "absolute",
            inset: frame,
            background: `linear-gradient(115deg, transparent ${(pos - band / 2) * 100}%, rgba(255,255,255,.15) ${pos * 100}%, transparent ${(pos + band / 2) * 100}%)`,
          }}
        />
      ) : null}
    </div>
  );
}
