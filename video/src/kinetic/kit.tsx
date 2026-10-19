import type { CSSProperties, ReactNode } from "react";
import { NBSP } from "../data/typo";
import { fonts } from "../theme/fonts";

// «Кто ты?» — kinetic type reel (1080×1920, 100 BPM, 42 beats ≈ 25 s). Scene starts, palette, type styles and the
// small helpers every scene uses: per-letter words, a 3D stage, depth of field.

export const KT_BPM = 100;
export const KT_BEATS = 42;

/** Scene starts, beats. */
export const KT = {
  wall: 0,
  silent: 3,
  until: 5,
  painting: 8,
  says: 11,
  forYou: 14,
  who: 16,
  bold: 20,
  calm: 24,
  dreamer: 28,
  many: 32,
  find: 36,
} as const;

export const K = {
  wall: "#E7E4DE",
  wallInk: "#CFCAC2",
  ink: "#111111",
  white: "#FFFFFF",
  accent: "#E0502E",
  calm: "#C4DAE8",
  skyTop: "#9FC2F2",
  skyBottom: "#EEF4FF",
} as const;

/** Onest at any weight: lower case unless told otherwise, tight. */
export const sans = (size: number, weight: number, color: string, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: fonts.sans,
  fontWeight: weight,
  fontSize: size,
  lineHeight: 0.82,
  letterSpacing: "-0.045em",
  color,
  whiteSpace: "pre",
  ...extra,
});

/** Piazzolla Italic, light (300) or black (800). */
export const serif = (size: number, weight: 300 | 800, color: string, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: fonts.serif,
  fontStyle: "italic",
  fontWeight: weight,
  fontSize: size,
  lineHeight: 0.9,
  letterSpacing: "-0.02em",
  fontVariationSettings: '"opsz" 30',
  color,
  whiteSpace: "pre",
  ...extra,
});

/** A word as separate letters, each styled by `letter(i, n)` (offsets, rotations, opacity…). */
export function Letters({ text, style, letter }: { text: string; style: CSSProperties; letter: (i: number, n: number) => CSSProperties }) {
  const chars = text.split("");
  return (
    <div style={{ ...style, display: "flex", alignItems: "baseline" }}>
      {chars.map((ch, i) => (
        <span key={i} style={{ display: "inline-block", ...letter(i, chars.length) }}>
          {ch === " " ? NBSP : ch}
        </span>
      ))}
    </div>
  );
}

/**
 * A 3D stage: everything inside lives in world px with the screen centre at (0, 0) and z towards the viewer.
 * The camera sits at `cam` (z = distance in front of the z = 0 plane) and can turn (degrees).
 */
export function Stage3D({
  cam = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  perspective = 1600,
  children,
  style,
}: {
  cam?: { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number };
  perspective?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 } = cam;
  return (
    <div style={{ position: "absolute", inset: 0, perspective, perspectiveOrigin: "50% 50%", overflow: "hidden", ...style }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transformStyle: "preserve-3d",
          transform: `rotateZ(${-rz}deg) rotateX(${-rx}deg) rotateY(${-ry}deg) translate3d(${-x}px, ${-y}px, ${z}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A flat layer placed in the 3D stage, centred on (x, y, z), optionally turned. */
export function Layer({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, blur = 0, children, style }: { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; blur?: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transformStyle: "preserve-3d",
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
        ...style,
      }}
    >
      <div style={{ transform: "translate(-50%, -50%)" }}>{children}</div>
    </div>
  );
}

/** Depth of field: blur growing with the distance from the focus plane. */
export const dof = (z: number, focus: number, k = 0.012, max = 14) => Math.min(max, Math.abs(z - focus) * k);
