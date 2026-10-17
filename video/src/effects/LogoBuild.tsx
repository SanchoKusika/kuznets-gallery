import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LOGO_SIZE, logoParts, type LogoPart } from "../brand/logo-parts";
import { ease, progress } from "../theme/easing";
import { timingAt, useTiming, type Timing } from "../theme/timing";

// The logo assembled part by part (brief 6.3): wave → beads → letters → dot pop + GALLERY.
// All parts keep the logo's own colours. Frames are relative to the enclosing Sequence.

/** When each part animates. A part without an entry is shown finished from frame 0. */
export type LogoSchedule = {
  /** Wave revealed by a left → right mask; `duration: 0` = simply shown from `from` (a scene morphs a line into it). */
  wave?: { from: number; duration: number };
  /** Start frames of the three bead drops (left to right). */
  beads?: [number, number, number];
  /** Start of the KUZNETSOVS rise (first letter). */
  letters?: number;
  /** Dot pop 0 → 1.15 → 1. */
  dot?: number;
  /** GALLERY converging from wide tracking. */
  gallery?: number;
  /** One "breath" of the dot 1 → 1.12 → 1. */
  breath?: number;
};

/** Default schedules from the brief, in frames for the given timing. */
export const logoSchedule = {
  /** Reels R8, relative to the start of R8 (the scene morphs the canvas edge into the wave by +1.5b). */
  reels: (t: Timing): LogoSchedule => ({
    wave: { from: t.b(1.5), duration: 0 },
    beads: [t.b(1), t.b(2), t.b(3)],
    letters: t.b(3),
    dot: t.b(4),
    gallery: t.b(4),
  }),
  /** Promo, relative to the start of P10 (P11 = P10 + 4b). */
  promo: (t: Timing): LogoSchedule => ({
    wave: { from: t.b(1), duration: t.e(1) },
    beads: [t.b(1.5), t.b(2), t.b(2.5)],
    letters: t.b(3),
    dot: t.b(4),
    gallery: t.b(4),
    breath: t.b(10),
  }),
  /** Finished logo, no animation. */
  still: (): LogoSchedule => ({}),
};

/** Moves every frame of a schedule by `df` (e.g. −4b to mount the Promo schedule inside a P11-only Sequence). */
export const shiftSchedule = (s: LogoSchedule, df: number): LogoSchedule => ({
  wave: s.wave && { ...s.wave, from: s.wave.from + df },
  beads: s.beads && (s.beads.map((f) => f + df) as [number, number, number]),
  letters: s.letters === undefined ? undefined : s.letters + df,
  dot: s.dot === undefined ? undefined : s.dot + df,
  gallery: s.gallery === undefined ? undefined : s.gallery + df,
  breath: s.breath === undefined ? undefined : s.breath + df,
});

const byKind = (kind: LogoPart["kind"]) => logoParts.filter((p) => p.kind === kind);
const LETTERS = byKind("letter");
const GALLERY = byKind("gallery");
const BEADS = byKind("bead");
const WAVE = byKind("wave")[0];
const DOT = byKind("o-dot")[0];

const DOT_C = { x: (DOT.bbox[0] + DOT.bbox[2]) / 2, y: (DOT.bbox[1] + DOT.bbox[3]) / 2 };
const DOT_R = (DOT.bbox[2] - DOT.bbox[0] + DOT.bbox[3] - DOT.bbox[1]) / 4;
const GALLERY_CX = (GALLERY[0].bbox[0] + GALLERY[GALLERY.length - 1].bbox[2]) / 2;
// Ink extent of the whole mark (letters top → GALLERY / wave bottom), in source px.
const INK = {
  x0: Math.min(...logoParts.map((p) => p.bbox[0])),
  y0: Math.min(...logoParts.map((p) => p.bbox[1])),
  x1: Math.max(...logoParts.map((p) => p.bbox[2])),
  y1: Math.max(...logoParts.map((p) => p.bbox[3])),
};

type Box = { x0: number; y0: number; x1: number; y1: number };

export type LogoGeometry = {
  /** Screen px per source px. */
  scale: number;
  /** The full 499×192 canvas on screen. */
  box: Box & { w: number; h: number };
  /** Visible ink of the mark (tighter than `box`). */
  ink: Box;
  /** Orange dot in the «O»: centre and radius on screen. */
  dot: { cx: number; cy: number; r: number };
  wave: Box;
  /** Source px (499×192 space) → screen px. */
  toScreen: (px: number, py: number) => { x: number; y: number };
};

/** Where the logo lands on screen for a given width and centre (scenes open / collapse circles from the dot). */
export function logoGeometry(width: number, x: number, y: number): LogoGeometry {
  const scale = width / LOGO_SIZE.w;
  const h = LOGO_SIZE.h * scale;
  const x0 = x - width / 2;
  const y0 = y - h / 2;
  const toScreen = (px: number, py: number) => ({ x: x0 + px * scale, y: y0 + py * scale });
  const map = (b: Box): Box => ({ x0: x0 + b.x0 * scale, y0: y0 + b.y0 * scale, x1: x0 + b.x1 * scale, y1: y0 + b.y1 * scale });
  const [wx0, wy0, wx1, wy1] = WAVE.bbox;
  const c = toScreen(DOT_C.x, DOT_C.y);
  return {
    scale,
    box: { x0, y0, x1: x0 + width, y1: y0 + h, w: width, h },
    ink: map(INK),
    dot: { cx: c.x, cy: c.y, r: DOT_R * scale },
    wave: map({ x0: wx0, y0: wy0, x1: wx1, y1: wy1 }),
    toScreen,
  };
}

type Props = {
  /** On-screen width of the 499×192 canvas. */
  width: number;
  /** Centre of the canvas on screen. */
  x: number;
  y: number;
  /** Frames relative to the Sequence; default — Reels R8 (brief 7). */
  schedule?: LogoSchedule;
  /** Extra scale of the dot on top of pop / breath (scenes that pulse it). */
  dotScale?: number;
  style?: CSSProperties;
};

/** The logo built part by part; any frame after the schedule shows the finished logo. */
export function LogoBuild({ width, x, y, schedule, dotScale = 1, style }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTiming();
  const s = schedule ?? logoSchedule.reels(t);
  const g = logoGeometry(width, x, y);
  const uid = `logo-${Math.round(x)}-${Math.round(y)}-${Math.round(width)}`;

  // Wave: clip rect grows left → right.
  const [wx0, wy0, wx1, wy1] = WAVE.bbox;
  const waveP = s.wave ? progress(frame, s.wave.from, s.wave.duration, ease.out) : 1;

  // Letters: each rises inside its own clip, 3 frames apart (1/12 beat), 1.25b, rise.
  const step = t.b(1 / 12);
  const riseDur = t.b(1.25);
  const lettersTop = Math.min(...LETTERS.map((l) => l.bbox[1])) - 1;
  const lettersBottom = Math.max(...LETTERS.map((l) => l.bbox[3])) + 1;
  const riseBy = (lettersBottom - lettersTop) * 1.05;

  // Dot: pop over ½b, optional breath over 1b.
  const popP = s.dot === undefined ? 1 : progress(frame, s.dot, t.e(1), ease.linear);
  const pop = s.dot === undefined || frame >= s.dot + t.e(1)
    ? 1
    : interpolate(popP, [0, 0.55, 1], [0, 1.15, 1], { easing: ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathP = s.breath === undefined ? 0 : progress(frame, s.breath, t.b(1), ease.linear);
  const breath = 1 + 0.12 * Math.sin(Math.PI * ease.inOut(breathP));
  const dotK = pop * breath * dotScale;

  // GALLERY: from wide tracking, with a fade, 1b.
  const galP = s.gallery === undefined ? 1 : progress(frame, s.gallery, t.b(1), ease.out);

  return (
    <svg
      width={g.box.w}
      height={g.box.h}
      viewBox={`0 0 ${LOGO_SIZE.w} ${LOGO_SIZE.h}`}
      style={{ position: "absolute", left: g.box.x0, top: g.box.y0, overflow: "visible", ...style }}
    >
      <defs>
        <clipPath id={`${uid}-wave`}>
          <rect x={wx0 - 2} y={wy0 - 4} width={(wx1 - wx0 + 4) * waveP} height={wy1 - wy0 + 8} />
        </clipPath>
        {LETTERS.map((l) => (
          <clipPath key={l.id} id={`${uid}-${l.id}`}>
            <rect x={l.bbox[0] - 1} y={lettersTop} width={l.bbox[2] - l.bbox[0] + 2} height={lettersBottom - lettersTop} />
          </clipPath>
        ))}
      </defs>

      {waveP > 0 ? <path d={WAVE.d} fill={WAVE.fill} clipPath={waveP < 1 ? `url(#${uid}-wave)` : undefined} /> : null}

      {BEADS.map((b, i) => {
        const from = s.beads?.[i];
        if (from === undefined) return <path key={b.id} d={b.d} fill={b.fill} />;
        if (frame < from) return null;
        const dy = beadDrop(frame - from, fps, t);
        const op = progress(frame, from, t.s(1) / 2, ease.out);
        return <path key={b.id} d={b.d} fill={b.fill} opacity={op} transform={`translate(0 ${dy})`} />;
      })}

      {LETTERS.map((l, i) => {
        if (s.letters === undefined) return <path key={l.id} d={l.d} fill={l.fill} />;
        const p = progress(frame, s.letters + i * step, riseDur, ease.rise);
        if (p <= 0) return null;
        return (
          <g key={l.id} clipPath={p < 1 ? `url(#${uid}-${l.id})` : undefined}>
            <path d={l.d} fill={l.fill} transform={`translate(0 ${(1 - p) * riseBy})`} />
          </g>
        );
      })}

      {dotK > 0 ? (
        <path
          d={DOT.d}
          fill={DOT.fill}
          transform={`translate(${DOT_C.x} ${DOT_C.y}) scale(${dotK}) translate(${-DOT_C.x} ${-DOT_C.y})`}
        />
      ) : null}

      {galP > 0
        ? GALLERY.map((l) => {
            const cx = (l.bbox[0] + l.bbox[2]) / 2;
            const dx = (cx - GALLERY_CX) * 0.55 * (1 - galP);
            return <path key={l.id} d={l.d} fill={l.fill} opacity={galP} transform={`translate(${dx} 0)`} />;
          })
        : null}
    </svg>
  );
}

/**
 * Bead fall with a bounce, ½b: a deterministic spring whose overshoot is mirrored upwards,
 * so the bead lands on the wave and hops instead of sinking through it. Returns source-px offset (≤ 0).
 */
function beadDrop(f: number, fps: number, t: Timing) {
  const DROP = 120;
  // From rest an underdamped spring is fastest exactly at 1 — the moment of impact.
  const s = spring({ frame: f, fps, config: { damping: 7, stiffness: 160, mass: 0.6 }, durationInFrames: t.e(1) });
  return -DROP * Math.abs(1 - s);
}

/** A default schedule outside a component (no hooks). */
export const logoScheduleAt = (fps: number, kind: "reels" | "promo") => logoSchedule[kind](timingAt(fps));
