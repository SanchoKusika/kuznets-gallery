import type { ReactNode } from "react";
import { useMemo } from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, mix, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";
import { color, stroke } from "../theme/tokens";

// The Instagram avatar in vector (brief 3.4): orange → yellow gradient, a band of curved rhombic
// lattice above and below the logo. Measured from public/brand/avatar.jpg (300×300); all lattice
// sizes below are in avatar px and scaled by `bands.unit`.

/** Lattice rows: distance from the small diamond (far end) for 0…4 half-pitches of sideways travel. */
const ROWS = [0, 13.4, 27.5, 45, 71.2];
/** Half the column pitch, avatar px. */
const HALF = 17.2;
/** Small diamond at the far end of each column: half-width, half-height. */
const SMALL = { hw: 8.4, hh: 5.95 };
/** Band height (small diamond's far vertex → V tip near the logo). */
export const BAND_H = ROWS[4] + 2 * SMALL.hh;
export const AVATAR_COLUMNS = 7;

/** Rows as a smooth monotone curve (Catmull-Rom through the measured rows): the diamonds stretch towards the logo. */
function rowAt(f: number) {
  const pts = [-ROWS[1], ...ROWS, ROWS[4] + 2 * (ROWS[4] - ROWS[3]) - (ROWS[3] - ROWS[2])];
  const i = Math.min(3, Math.max(0, Math.floor(f)));
  const u = f - i;
  const [p0, p1, p2, p3] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}

/** Sideways travel of a strand bouncing between a column's centre and its edge (0 ↔ 1 half-pitch). */
const zigzag = (f: number) => {
  const m = f % 2;
  return m <= 1 ? m : 2 - m;
};

type Pt = [number, number];
const toD = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");

/**
 * One column in avatar px, x = 0 at the column centre, y = 0 at the V tip, growing away from the logo.
 * Paths start at the tip (near the logo) and run outwards, so drawing reads "from the centre out".
 */
function columnPaths() {
  const side = (dir: 1 | -1) => {
    const pts: Pt[] = [];
    for (let k = 100; k >= 0; k--) {
      const f = k / 25;
      pts.push([dir * HALF * zigzag(f), ROWS[4] - rowAt(f)]);
    }
    return toD(pts);
  };
  const y0 = ROWS[4];
  const small = (dir: 1 | -1) =>
    toD([
      [0, y0],
      [dir * SMALL.hw, y0 + SMALL.hh],
      [0, y0 + 2 * SMALL.hh],
    ]);
  return { sides: [side(-1), side(1)], small: [small(-1), small(1)] };
}

export type AvatarBands = {
  /** Centre x of the lattice. */
  cx: number;
  /** Screen px per avatar px (the avatar's logo is 0.56 avatar px per logo px). */
  unit: number;
  /** y of the top band's V tips (its edge nearest the logo). */
  topTip: number;
  /** y of the bottom band's apexes (its edge nearest the logo). */
  bottomTip: number;
  columns?: number;
};

/** Reels R8 layout: logo 820 wide at (540, 700), CTA texts down to y ≈ 1145 — bands hug the logo + CTA block. */
export const REELS_BANDS: AvatarBands = { cx: 540, unit: 2.93, topTip: 551, bottomTip: 1192 };

/** Scale that matches the avatar's proportions for a logo of the given on-screen width. */
export const avatarUnit = (logoWidth: number) => logoWidth / 499 / 0.56;

type Props = {
  /** Origin of the reveal circle — the logo's dot (logoGeometry().dot). */
  origin: { x: number; y: number };
  /** Gradient circle reveal, frames relative to the Sequence; default +0, 1b, in-out. */
  reveal?: { from: number; duration: number };
  /** Lattice drawing from the logo outwards; default +½b, 1.5b. */
  lattice?: { from: number; duration: number };
  bands?: AvatarBands;
  strokeWidth?: number;
};

/** Gradient + lattice, revealed by a circle from the logo's dot; sits UNDER the logo and texts. */
export function AvatarOutro({ origin, reveal, lattice, bands = REELS_BANDS, strokeWidth = stroke.reels * 1.2 }: Props) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = useTiming();
  const rv = reveal ?? { from: 0, duration: t.b(1) };
  const lt = lattice ?? { from: rv.from + t.e(1), duration: t.b(1.5) };
  const col = useMemo(columnPaths, []);

  const maxR = Math.max(...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)));
  const r = maxR * progress(frame, rv.from, rv.duration, ease.inOut);
  if (r <= 0) return null;

  const n = bands.columns ?? AVATAR_COLUMNS;
  const pitch = 2 * HALF * bands.unit;
  const mid = (n - 1) / 2;
  // Columns start from the centre outwards; each column draws its strands, then the small diamond.
  const stagger = 0.28 / Math.max(1, mid);
  const colP = (i: number) => {
    const p = progress(frame, lt.from, lt.duration, ease.linear);
    const d = Math.abs(i - mid) * stagger;
    return ease.out(Math.max(0, Math.min(1, (p - d) / (1 - mid * stagger))));
  };

  // Line colour as measured: golden over the orange side, darker ochre over the yellow side (per column).
  const lineL = interpolateColors(0.45, [0, 1], [color.avatarLine, color.avatarRight]);
  const lineR = interpolateColors(0.12, [0, 1], [color.avatarLine, color.logoInk]);
  const sw = strokeWidth / bands.unit;

  const band = (key: string, tipY: number, dir: 1 | -1) => (
    <g key={key}>
      {Array.from({ length: n }, (_, i) => {
        const p = colP(i);
        if (p <= 0) return null;
        const x = bands.cx + (i - mid) * pitch;
        const sideP = Math.min(1, p / 0.8);
        const smallP = Math.max(0, (p - 0.8) / 0.2);
        return (
          <g key={i} stroke={interpolateColors(x / width, [0, 1], [lineL, lineR])} transform={`translate(${x} ${tipY}) scale(${bands.unit} ${dir * bands.unit})`}>
            {col.sides.map((d, k) => (
              <path key={k} d={d} pathLength={1} strokeDasharray={`${sideP} 2`} />
            ))}
            {smallP > 0 ? col.small.map((d, k) => <path key={`s${k}`} d={d} pathLength={1} strokeDasharray={`${smallP} 2`} />) : null}
          </g>
        );
      })}
    </g>
  );

  return (
    <AbsoluteFill style={{ clipPath: `circle(${r.toFixed(1)}px at ${origin.x}px ${origin.y}px)` }}>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${color.avatarLeft}, ${color.avatarRight})` }} />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <g fill="none" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          {band("top", bands.topTip, -1)}
          {band("bottom", bands.bottomTip, 1)}
        </g>
      </svg>
    </AbsoluteFill>
  );
}

type CollapseProps = {
  /** The logo's dot on screen (logoGeometry().dot). */
  dot: { cx: number; cy: number; r: number };
  /** Everything shrinks into the dot: circle mask maxR → dot radius; default +0, ¾b, in-out. */
  collapse?: { from: number; duration: number };
  /** Then the dot leaves past the left edge; default right after the collapse, ¼b, ease-in. */
  exit?: { from: number; duration: number };
  /** The dot becomes the R1 accent point on the way out (loop seam): colour and diameter at the edge. */
  exitColor?: string;
  exitSize?: number;
  children: ReactNode;
};

/** Final collapse of the Reels (R8 +11b): the whole outro shrinks into the orange dot, which then exits left. */
export function CollapseToDot({ dot, collapse, exit, exitColor = color.accent, exitSize = 28, children }: CollapseProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = useTiming();
  const c = collapse ?? { from: 0, duration: t.b(0.75) };
  const ex = exit ?? { from: c.from + c.duration, duration: t.s(1) };
  if (frame < c.from) return <AbsoluteFill>{children}</AbsoluteFill>;

  if (frame < ex.from) {
    const maxR = Math.max(...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - dot.cx, y - dot.cy)));
    const r = mix(maxR, dot.r, progress(frame, c.from, c.duration, ease.inOut));
    return <AbsoluteFill style={{ clipPath: `circle(${r.toFixed(1)}px at ${dot.cx}px ${dot.cy}px)` }}>{children}</AbsoluteFill>;
  }

  const p = progress(frame, ex.from, ex.duration, ease.in);
  const size = mix(dot.r * 2, exitSize, p);
  const x = mix(dot.cx, -exitSize, p);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: dot.cy - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: interpolateColors(p, [0, 1], [color.logoDot, exitColor]),
        }}
      />
    </AbsoluteFill>
  );
}
