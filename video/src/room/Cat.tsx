import { fonts } from "../theme/fonts";
import { bold } from "../theme/tokens";
import { FINE, INK, LINE } from "./layout";

// The cat on the sofa — the reel's one constant character. Drawn round its seat point (690, 1192); a scene gives it a
// mood (eyes, head, ears), a prop, and a pose (it floats in space, rises on balloons).

export type CatProp = "none" | "umbrella" | "mask" | "helmet" | "glasses" | "balloons" | "sleep";

export type CatState = {
  /** Head turn, degrees (negative looks up-left). */
  head?: number;
  /** 0 open … 1 shut. */
  lids?: number;
  /** Ears down, 0…1 (rain). */
  earsDown?: number;
  /** Tail swing, degrees. */
  tail?: number;
  prop?: CatProp;
  /** How far the prop is in, 0…1 (umbrella opens, helmet pops on, balloons rise). */
  propP?: number;
  /** Whole-cat pose. */
  dx?: number;
  dy?: number;
  rot?: number;
  /** Beat count for idle details (zzz, bubbles). */
  beat?: number;
};

export const CAT = { x: 690, y: 1192 } as const;
const FUR = "#F0A35E";
const BELLY = "#F9D9B2";

const s = { stroke: INK, strokeWidth: LINE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const f = { stroke: INK, strokeWidth: FINE, strokeLinecap: "round" as const, fill: "none" };

export function Cat({ head = 0, lids = 0, earsDown = 0, tail = 0, prop = "none", propP = 1, dx = 0, dy = 0, rot = 0, beat = 0 }: CatState) {
  const eye = (x: number) =>
    lids >= 0.95 ? (
      <path d={`M${x - 8} -124Q${x} -118 ${x + 8} -124`} {...f} strokeWidth={4} />
    ) : (
      <g>
        <ellipse cx={x} cy={-125} rx={6} ry={8 * (1 - lids)} fill={INK} />
        {lids > 0 ? <path d={`M${x - 9} ${-125 - 8 * (1 - lids)}H${x + 9}`} {...f} strokeWidth={3} /> : null}
      </g>
    );
  const ear = (side: 1 | -1) => {
    const droop = earsDown * 38 * side;
    return (
      <g transform={`rotate(${droop} ${side * 24} -150)`}>
        <path d={`M${side * 40} -140L${side * 32} -182L${side * 8} -158Z`} fill={FUR} {...s} />
        <path d={`M${side * 32} -146L${side * 29} -168L${side * 17} -158`} {...f} />
      </g>
    );
  };

  return (
    <g transform={`translate(${CAT.x + dx} ${CAT.y + dy}) rotate(${rot})`}>
      {/* Balloons go up behind the cat. */}
      {prop === "balloons" && propP > 0 ? <Balloons p={propP} beat={beat} /> : null}
      {/* Tail over the seat's edge. */}
      <g transform={`rotate(${tail} 46 -12)`}>
        <path d="M44 -14C96 -16 116 30 98 76" fill="none" {...s} strokeWidth={22} stroke={INK} />
        <path d="M44 -14C96 -16 116 30 98 76" fill="none" stroke={FUR} strokeWidth={13} strokeLinecap="round" />
      </g>
      <path d="M-54 0C-62 -44 -44 -88 -16 -98H16C44 -88 62 -44 54 0Z" fill={FUR} {...s} />
      <path d="M-22 -4C-28 -40 -18 -70 0 -76C18 -70 28 -40 22 -4" {...f} fill={BELLY} />
      <path d="M-34 0C-34 -14 -12 -14 -12 0M12 0C12 -14 34 -14 34 0" fill={BELLY} {...s} strokeWidth={LINE - 1} />
      <g transform={`rotate(${head} 0 -98)`}>
        {ear(-1)}
        {ear(1)}
        <ellipse cx={0} cy={-122} rx={47} ry={41} fill={FUR} {...s} />
        <path d="M-20 -160Q-14 -150 -18 -140M0 -163V-150M20 -160Q14 -150 18 -140" {...f} />
        {eye(-17)}
        {eye(17)}
        <path d="M-5 -110H5L0 -104Z" fill={INK} />
        <path d="M0 -104Q-7 -96 -13 -100M0 -104Q7 -96 13 -100" {...f} />
        <path d="M-24 -108L-62 -114M-24 -104L-60 -100M24 -108L62 -114M24 -104L60 -100" {...f} strokeWidth={2} />
        {prop === "mask" ? <Mask p={propP} /> : null}
        {prop === "glasses" ? <Glasses p={propP} /> : null}
        {prop === "helmet" ? <Helmet p={propP} /> : null}
      </g>
      {prop === "umbrella" ? <Umbrella p={propP} /> : null}
      {prop === "sleep" ? <Zzz beat={beat} p={propP} /> : null}
    </g>
  );
}

function Umbrella({ p }: { p: number }) {
  const open = Math.max(0.08, p);
  const ribs = 6;
  // Scalloped canopy centred over the handle's top.
  const R = 120 * open;
  let d = `M${46 - R} -228`;
  for (let i = 0; i < ribs; i++) {
    const x0 = 46 - R + (2 * R * i) / ribs;
    const x1 = 46 - R + (2 * R * (i + 1)) / ribs;
    d += `Q${(x0 + x1) / 2} -212 ${x1} -228`;
  }
  d += `Q${46 + R * 0.7} ${-228 - 110 * Math.min(1, open * 1.2)} 46 ${-232 - 112 * Math.min(1, open * 1.2)}Q${46 - R * 0.7} ${-228 - 110 * Math.min(1, open * 1.2)} ${46 - R} -228Z`;
  return (
    <g>
      <path d="M30 -40L46 -232" {...s} />
      <path d="M30 -40Q24 -22 36 -18" fill="none" {...s} />
      <path d={d} fill={bold.accent} {...s} />
      {open > 0.5 ? <path d={`M46 ${-232 - 112}V-228M${46 - R * 0.5} -226Q${46 - R * 0.3} -300 46 -344M${46 + R * 0.5} -226Q${46 + R * 0.3} -300 46 -344`} {...f} /> : null}
    </g>
  );
}

function Mask({ p }: { p: number }) {
  return (
    <g opacity={Math.min(1, p * 3)} transform={`translate(0 ${(1 - p) * -40})`}>
      <path d="M-44 -140H44V-110Q22 -100 0 -110Q-22 -100 -44 -110Z" fill="#BFE4F2" fillOpacity={0.85} {...s} />
      <path d="M-50 -126H-44M44 -126H50" {...s} />
      <path d="M50 -124Q66 -124 66 -150V-190" fill="none" {...s} strokeWidth={9} stroke={bold.accent} />
      <path d="M50 -124Q66 -124 66 -150V-190" {...f} fill="none" />
    </g>
  );
}

function Glasses({ p }: { p: number }) {
  return (
    <g transform={`translate(0 ${(1 - p) * -60})`} opacity={Math.min(1, p * 4)}>
      <path d="M-40 -134H-6V-118Q-6 -108 -18 -108H-30Q-40 -108 -40 -118ZM6 -134H40V-118Q40 -108 30 -108H18Q6 -108 6 -118Z" fill={INK} {...s} strokeWidth={3} />
      <path d="M-6 -130H6M-40 -132L-50 -136M40 -132L50 -136" {...s} strokeWidth={3} />
      <path d="M-32 -128L-22 -128M14 -128L24 -128" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
    </g>
  );
}

function Helmet({ p }: { p: number }) {
  const r = 74 * (0.4 + 0.6 * p);
  return (
    <g opacity={Math.min(1, p * 3)}>
      <circle cx={0} cy={-124} r={r} fill="#DDEBFF" fillOpacity={0.28} {...s} strokeWidth={LINE - 1} />
      <path d={`M${-r * 0.55} ${-124 - r * 0.6}Q${-r * 0.2} ${-124 - r * 0.95} ${r * 0.25} ${-124 - r * 0.9}`} stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d={`M${-r * 0.8} ${-124 + r * 0.6}H${r * 0.8}`} {...s} strokeWidth={8} />
    </g>
  );
}

const BALLOONS = [
  { x: -30, y: -360, c: bold.accent },
  { x: 40, y: -400, c: "#F6CF3C" },
  { x: 110, y: -350, c: "#3E7BD8" },
] as const;

function Balloons({ p, beat }: { p: number; beat: number }) {
  return (
    <g>
      {BALLOONS.map((b, i) => {
        const sw = Math.sin(beat * 2.2 + i * 1.7) * 8;
        const y = b.y * p + -40 * (1 - p);
        const x = b.x + sw;
        return (
          <g key={i}>
            <path d={`M28 -36Q${(x + 28) / 2 + 10} ${(y - 36) / 2} ${x} ${y + 50}`} {...f} strokeWidth={2.5} />
            <ellipse cx={x} cy={y} rx={42 * p} ry={50 * p} fill={b.c} {...s} />
            <path d={`M${x - 4} ${y + 50}L${x + 4} ${y + 50}L${x} ${y + 58}Z`} fill={b.c} {...s} strokeWidth={3} />
            <path d={`M${x - 20 * p} ${y - 20 * p}Q${x - 14 * p} ${y - 34 * p} ${x} ${y - 36 * p}`} stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
          </g>
        );
      })}
    </g>
  );
}

function Zzz({ beat, p }: { beat: number; p: number }) {
  return (
    <g opacity={Math.min(1, p * 2)}>
      {[0, 1, 2].map((i) => {
        const u = (beat * 0.6 + i / 3) % 1;
        return (
          <text
            key={i}
            x={40 + u * 50}
            y={-170 - u * 140}
            opacity={Math.sin(Math.PI * u)}
            style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 30 + u * 34, fill: INK }}
          >
            z
          </text>
        );
      })}
    </g>
  );
}
