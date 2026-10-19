import type { ReactNode } from "react";
import { random } from "remotion";
import { circle, ellipse, leaf } from "../lines/shapes";
import { ease, mix, progress } from "../theme/easing";
import { bold } from "../theme/tokens";
import type { Poses } from "./Base";
import type { CatState } from "./Cat";
import { FINE, INK, LINE, WIN, type SceneKey } from "./layout";

// What each painting does to the room. A scene gets its local frame `f`, the beat length, and `life` — 0→1 as it
// arrives, 1→0 as it leaves — and returns layers: inside the window, behind the furniture, in front of everything,
// plus poses for the furniture, the cat's mood and things on the table and rug.

export type FxIn = { f: number; B: number; life: number; enter: number };
export type FxOut = {
  sky?: ReactNode;
  back?: ReactNode;
  front?: ReactNode;
  poses?: Poses;
  cat: CatState;
  onTable?: ReactNode;
  onRug?: ReactNode;
};

const s = { stroke: INK, strokeWidth: LINE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const fn = { stroke: INK, strokeWidth: FINE, strokeLinecap: "round" as const, fill: "none" };
const W = { x: WIN.x0, y: WIN.y0, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0 };
const sky = (fill: string, children?: ReactNode) => (
  <g>
    <rect x={W.x} y={W.y} width={W.w} height={W.h} fill={fill} />
    {children}
  </g>
);
/** Ease-out with an overshoot (things growing and popping in): 0 → ~1.1 → 1. */
const grow = (p: number) => {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const c1 = 1.70158;
  return 1 + (c1 + 1) * (p - 1) ** 3 + c1 * (p - 1) ** 2;
};
const pop = grow;

/* ── Jungle: leaves burst in from every edge, vines drop from the ceiling, a parrot flies through. ───────────── */

const JUNGLE_LEAVES: [number, number, number, number, number, string][] = [
  // x, y, angle, length, half-width, colour
  [-20, 1780, 55, 420, 120, "#3F8F3A"],
  [-30, 1460, 75, 360, 100, "#5DAE4A"],
  [-20, 1080, 100, 300, 90, "#2E6E2E"],
  [-10, 700, 120, 280, 86, "#5DAE4A"],
  [120, -20, 160, 330, 96, "#3F8F3A"],
  [960, -20, 200, 330, 96, "#2E6E2E"],
  [1100, 680, 240, 290, 88, "#3F8F3A"],
  [1100, 1060, 262, 320, 96, "#5DAE4A"],
  [1100, 1450, 285, 380, 110, "#2E6E2E"],
  [1100, 1800, 305, 430, 124, "#3F8F3A"],
  [300, 1960, 15, 300, 96, "#5DAE4A"],
  [780, 1960, -12, 320, 100, "#3F8F3A"],
];
const VINES = [210, 380, 640, 860];

function jungle({ f, B, life, enter }: FxIn): FxOut {
  const front = (
    <g>
      {VINES.map((x, i) => {
        const len = mix(0, 380 + (i % 2) * 140, ease.out(Math.min(1, enter * 1.3))) * life;
        if (len <= 2) return null;
        const sw = Math.sin(f / B * 2 + i) * 14;
        const d = `M${x} 0Q${x + sw} ${len / 2} ${x + sw * 0.6} ${len}`;
        return (
          <g key={i}>
            <path d={d} fill="none" {...s} strokeWidth={6} stroke="#2E6E2E" />
            {[0.35, 0.6, 0.85].map((u, j) =>
              u * len > 30 ? <path key={j} d={leaf(x + sw * u * 0.8, u * len, j % 2 ? 130 : 230, 64, 22)} fill="#5DAE4A" {...s} strokeWidth={3} /> : null,
            )}
          </g>
        );
      })}
      {JUNGLE_LEAVES.map(([x, y, a, l, w, c], i) => {
        const p = grow(progress(f, i * 1.2, B * 0.55, ease.linear)) * life;
        if (p <= 0.01) return null;
        const sw = Math.sin(f / B * 2.4 + i * 0.9) * 3;
        return <path key={i} d={leaf(x, y, a + sw, l * p, w * p)} fill={c} {...s} />;
      })}
      <Parrot f={f - B * 0.9} B={B} />
    </g>
  );
  const px = parrotX(f - B * 0.9, B);
  return {
    sky: sky("#A6D88A", <path d={leaf(W.x + 40, W.y + W.h + 10, 20, 160, 50) + leaf(W.x + W.w - 30, W.y + W.h + 10, -25, 180, 54)} fill="#3F8F3A" {...s} strokeWidth={3} />),
    front,
    poses: { plant: { scale: 1 + 0.35 * life } },
    cat: { head: px == null ? -6 * life : mix(-22, 18, Math.min(1, Math.max(0, px / 1080))), lids: 0, tail: Math.sin(f / B * 4) * 16 },
  };
}

const parrotX = (f: number, B: number) => (f < 0 || f > B * 1.6 ? null : mix(-160, 1240, f / (B * 1.6)));
function Parrot({ f, B }: { f: number; B: number }) {
  const x = parrotX(f, B);
  if (x == null) return null;
  const y = 600 + Math.sin(f / 6) * 26 - (f / (B * 1.6)) * 120;
  const flap = Math.sin(f * 0.9) * 32;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-70 10L-120 34L-112 4Z" fill="#3E7BD8" {...s} strokeWidth={4} />
      <path d={ellipse(0, 0, 66, 34)} fill={bold.accent} {...s} />
      <g transform={`rotate(${flap} -6 -8)`}>
        <path d="M-6 -8C-30 -70 30 -90 34 -20Z" fill="#F6CF3C" {...s} strokeWidth={4} />
      </g>
      <path d={circle(56, -16, 26)} fill={bold.accent} {...s} />
      <path d="M78 -22Q100 -16 84 0Z" fill="#F6CF3C" {...s} strokeWidth={4} />
      <circle cx={62} cy={-22} r={5} fill={INK} />
    </g>
  );
}

/* ── Rain: night in the window, rain inside the room, a puddle, lightning; the cat opens an umbrella. ────────── */

const DROPS = Array.from({ length: 90 }, (_, i) => ({ x: random(`rx${i}`) * 1240 - 80, y0: random(`ry${i}`) * 1920, v: 34 + random(`rv${i}`) * 14 }));

function rain({ f, B, life, enter }: FxIn): FxOut {
  const flashAt = Math.round(B * 1.4);
  const flash = f >= flashAt && f < flashAt + 6 ? [1, 0.25, 0.85, 0.5, 0.2, 0.05][f - flashAt] : 0;
  const bolt = f >= flashAt && f < flashAt + 6;
  const front = (
    <g opacity={life}>
      {DROPS.map((d, i) => {
        const y = ((d.y0 + f * d.v) % 2040) - 60;
        return <path key={i} d={`M${d.x} ${y}l-10 56`} stroke="#E8F0FF" strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />;
      })}
      {Array.from({ length: 10 }, (_, i) => {
        const u = ((f + i * 9) % 18) / 18;
        const x = 120 + random(`sp${i}${Math.floor((f + i * 9) / 18)}`) * 840;
        const y = 1640 + random(`spy${i}${Math.floor((f + i * 9) / 18)}`) * 240;
        return <path key={`s${i}`} d={ellipse(x, y, 12 + 26 * u, 4 + 8 * u)} fill="none" stroke="#E8F0FF" strokeWidth={3} opacity={(1 - u) * 0.9} />;
      })}
      {flash > 0 ? <rect width={1080} height={1920} fill="#FFFFFF" opacity={flash * 0.75} /> : null}
    </g>
  );
  return {
    sky: sky(
      flash > 0.5 ? "#7A8FB8" : "#1F2B3D",
      <g>
        {Array.from({ length: 14 }, (_, i) => {
          const y = ((random(`wy${i}`) * 400 + f * 30) % 360) + W.y - 40;
          return <path key={i} d={`M${W.x + random(`wx${i}`) * W.w} ${y}l-6 34`} stroke="#B8C8E8" strokeWidth={2.5} strokeLinecap="round" />;
        })}
        {bolt ? <path d={`M${W.x + 120} ${W.y}L${W.x + 80} ${W.y + 110}L${W.x + 112} ${W.y + 112}L${W.x + 60} ${W.y + 260}`} fill="none" stroke="#FFF6B0" strokeWidth={7} strokeLinejoin="round" /> : null}
      </g>,
    ),
    back: <path d={ellipse(250, 1790, 230 * ease.out(Math.min(1, enter * 1.2)) * life, 46 * life)} {...fn} fill="#9FB6D4" opacity={0.8} />,
    front,
    cat: { earsDown: life, prop: "umbrella", propP: progress(f, B * 0.3, B * 0.35, ease.out) * life, lids: 0.15, tail: -10, head: flash > 0 ? -8 : 0 },
  };
}

/* ── Water: the room floods to the sofa's back; goldfish swim, a shark fin cuts the surface; the cat dives. ─── */

const BUBBLES = Array.from({ length: 22 }, (_, i) => ({ x: 60 + random(`bx${i}`) * 960, r: 6 + random(`br${i}`) * 12, v: 3 + random(`bv${i}`) * 3, ph: random(`bp${i}`) * 900 }));
const FISH = [
  { y: 1300, v: 6.5, dir: 1, size: 1, c: "#F28C28" },
  { y: 1560, v: -5, dir: -1, size: 1.25, c: "#F6A13A" },
  { y: 1720, v: 7.5, dir: 1, size: 0.8, c: "#E9762B" },
];

function water({ f, B, life }: FxIn): FxOut {
  const rise = progress(f, 0, B * 0.8, ease.out);
  const level = mix(1960, 1040, rise * life);
  const surf = (x: number) => level + 14 * Math.sin(x * 0.012 + f * 0.15) + 7 * Math.sin(x * 0.027 - f * 0.21);
  const pts = Array.from({ length: 28 }, (_, i) => [i * 40, surf(i * 40)] as const);
  const top = "M" + pts.map(([x, y]) => `${x} ${y.toFixed(1)}`).join("L");
  const finX = mix(1180, -120, progress(f, B * 0.9, B * 1.8, ease.linear));
  const front = (
    <g>
      <path d={`${top}L1080 1920L0 1920Z`} fill="#3E95C9" opacity={0.42} />
      {FISH.map((fi, i) => {
        const x = fi.dir > 0 ? -150 + ((f * fi.v + i * 300) % 1400) : 1250 + ((f * fi.v - i * 300) % 1400);
        const y = fi.y + Math.sin(f / 9 + i) * 18;
        if (y < level + 40) return null;
        const wag = Math.sin(f * 0.6 + i) * 14;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${fi.dir * fi.size} ${fi.size})`}>
            <g transform={`rotate(${wag} -40 0)`}>
              <path d="M-40 0L-86 -30L-80 0L-86 30Z" fill={fi.c} {...s} strokeWidth={4} />
            </g>
            <path d={ellipse(0, 0, 52, 30)} fill={fi.c} {...s} />
            <path d="M-6 -28Q6 -50 22 -26" fill={fi.c} {...s} strokeWidth={4} />
            <circle cx={30} cy={-6} r={6} fill={INK} />
          </g>
        );
      })}
      <path d={top} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      {BUBBLES.map((b, i) => {
        const y = 1940 - ((f * b.v * 2 + b.ph) % 960) * 1.0;
        if (y < level + b.r) return null;
        return <circle key={i} cx={b.x + Math.sin(f / 8 + i) * 8} cy={y} r={b.r} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />;
      })}
      {rise > 0.9 ? (
        <g transform={`translate(${finX} ${surf(finX) + 6})`}>
          <path d="M-60 0Q-10 -30 20 -130Q30 -60 70 0Z" fill="#5B6670" {...s} />
        </g>
      ) : null}
    </g>
  );
  const cupY = Math.min(0, surf(602) - 1446 - 20);
  return {
    sky: sky("#2D7FB0", <path d={`M${W.x + 30} ${W.y}L${W.x + 70} ${W.y + W.h}M${W.x + 110} ${W.y}L${W.x + 150} ${W.y + W.h}`} stroke="#9AD2F0" strokeWidth={14} opacity={0.4} />),
    front,
    poses: { cup: { dy: cupY * Math.min(1, rise * 1.2), rot: Math.sin(f / 10) * 10 } },
    cat: { prop: "mask", propP: progress(f, 2, B * 0.4, ease.out) * life, lids: 0, tail: Math.sin(f / 12) * 20 },
  };
}

/* ── Space: the walls go dark, stars come out, everything floats — sofa, lamp, plant, table, cup, cat. ─────── */

const STARS = Array.from({ length: 70 }, (_, i) => ({ x: random(`stx${i}`) * 1080, y: random(`sty${i}`) * 1920, r: 1.5 + random(`str${i}`) * 3.5, ph: random(`stp${i}`) * 6 }));

function space({ f, B, life }: FxIn): FxOut {
  const up = ease.inOut(progress(f, 2, B * 1.2, ease.linear)) * life;
  const bob = (i: number, a: number) => Math.sin(f / 20 + i) * a;
  const planetX = mix(W.x + W.w + 60, W.x - 80, progress(f, 0, B * 3, ease.linear));
  return {
    sky: sky(
      "#05070F",
      <g>
        {STARS.slice(0, 16).map((st, i) => (
          <circle key={i} cx={W.x + (st.x / 1080) * W.w} cy={W.y + (st.y / 1920) * W.h} r={st.r * 0.7} fill="#FFFFFF" />
        ))}
        <circle cx={planetX} cy={W.y + 150} r={46} fill="#E7A35A" {...s} strokeWidth={3} />
        <path d={ellipse(planetX, W.y + 150, 82, 18)} fill="none" stroke="#F4D7A8" strokeWidth={6} />
      </g>,
    ),
    back: (
      <g opacity={life}>
        {STARS.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.r * (0.6 + 0.4 * Math.sin(f / 7 + st.ph))} fill="#FFFFFF" />
        ))}
      </g>
    ),
    front: (
      <g opacity={life}>
        {f > B * 1.4 && f < B * 2.2 ? (
          <path d={`M${mix(-100, 1200, (f - B * 1.4) / (B * 0.8))} ${mix(380, 760, (f - B * 1.4) / (B * 0.8))}l-140 -50`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
        ) : null}
      </g>
    ),
    poses: {
      sofa: { dy: -70 * up + bob(1, 8) * up, rot: 4 * up + bob(2, 1.5) * up },
      lamp: { dy: -140 * up + bob(3, 10) * up, rot: 16 * up },
      shade: { dy: -150 * up + bob(3, 10) * up, rot: 24 * up },
      plant: { dy: -120 * up + bob(4, 10) * up, rot: -18 * up },
      table: { dy: -110 * up + bob(5, 8) * up, rot: 9 * up },
      cup: { dy: -260 * up + bob(6, 12) * up, rot: (120 + f * 1.5) * up },
      rug: { dy: -40 * up, rot: -3 * up },
    },
    cat: { prop: "helmet", propP: progress(f, 0, B * 0.3, ease.out) * life, dy: -190 * up + bob(7, 14) * up, rot: -14 * up + bob(8, 4) * up, tail: Math.sin(f / 15) * 30, lids: 0 },
  };
}

/* ── Desert: dunes rise over the floor, the plant turns into a cactus, a tumbleweed rolls by, the sun outside. ─ */

function desert({ f, B, life }: FxIn): FxOut {
  const rise = ease.out(progress(f, 0, B * 0.7, ease.linear)) * life;
  const dune = (y: number, a: number, ph: number, fill: string, k: number) => {
    const yy = mix(2100, y, rise * k);
    const pts = Array.from({ length: 13 }, (_, i) => `${i * 90} ${(yy + a * Math.sin(i * 0.7 + ph)).toFixed(1)}`);
    return <path d={`M0 1920L${pts.join("L")}L1080 1920Z`} fill={fill} {...s} />;
  };
  const tw = progress(f, B * 1.1, B * 1.6, ease.linear);
  const twx = mix(-120, 1200, tw);
  const cactus = grow(progress(f, 4, B * 0.6, ease.linear)) * life;
  return {
    sky: sky("#F6A65A", <circle cx={W.x + W.w * 0.55} cy={W.y + W.h * 0.62} r={70} fill="#FFE07A" {...s} strokeWidth={3} />),
    front: (
      <g>
        {cactus > 0 ? (
          <g transform={`translate(905 1335) scale(${cactus}) translate(-905 -1335)`}>
            <path d="M880 1335V1090Q905 1050 930 1090V1335ZM880 1210H846V1140Q860 1122 874 1140V1180H880ZM930 1170H962V1100Q948 1082 936 1100V1150H930Z" fill="#5E9E4E" {...s} />
            <path d="M896 1110V1320M914 1110V1320" {...fn} strokeWidth={2} />
            <circle cx={905} cy={1072} r={12} fill={bold.accent} {...s} strokeWidth={3} />
          </g>
        ) : null}
        {dune(1640, 40, 0.2, "#E9B872", 1)}
        {dune(1760, 50, 2.1, "#D99A55", 1)}
        {dune(1860, 30, 4.0, "#F2CF92", 1)}
        {tw > 0 && tw < 1 ? (
          <g transform={`translate(${twx} ${1700 - Math.abs(Math.sin(tw * 9)) * 60}) rotate(${tw * 900})`}>
            <path d={circle(0, 0, 58)} fill="none" {...s} strokeWidth={4} stroke="#8A5A2B" />
            <path d="M-40 -20Q0 40 40 -24M-30 30Q0 -40 34 30M-50 4Q0 -10 50 10" {...fn} stroke="#8A5A2B" />
          </g>
        ) : null}
      </g>
    ),
    poses: { plant: { scale: 1 - cactus, opacity: 1 - Math.min(1, cactus * 2) } },
    cat: { prop: "glasses", propP: progress(f, B * 0.4, B * 0.3, ease.out) * life, lids: 0.1, tail: Math.sin(f / 18) * 10, head: 6 },
  };
}

/* ── Sky: clouds drift through the room, the lamp shade floats off on its string, balloons lift the cat. ─────── */

const CLOUDS = [
  { y: 430, v: 2.4, s: 1.2, x0: 900 },
  { y: 980, v: -1.8, s: 0.9, x0: 200 },
  { y: 1500, v: 2.0, s: 1.4, x0: 600 },
  { y: 760, v: -2.6, s: 0.7, x0: 1000 },
];
const cloud = (s_: number) =>
  `M${-120 * s_} 0C${-130 * s_} ${-50 * s_} ${-60 * s_} ${-70 * s_} ${-40 * s_} ${-40 * s_}C${-30 * s_} ${-100 * s_} ${60 * s_} ${-100 * s_} ${60 * s_} ${-50 * s_}` +
  `C${110 * s_} ${-70 * s_} ${150 * s_} ${-10 * s_} ${120 * s_} 0Z`;

function skyScene({ f, B, life }: FxIn): FxOut {
  const lift = ease.inOut(progress(f, B * 0.2, B * 1.2, ease.linear)) * life;
  const hb = (x0: number, d: number, c1: string, c2: string, sc: number) => {
    const y = mix(2100, -300, progress(f, d, B * 2.6, ease.linear));
    const x = x0 + Math.sin(f / 25) * 20;
    return (
      <g transform={`translate(${x} ${y}) scale(${sc})`}>
        <path d="M-70 0C-70 -100 70 -100 70 0C70 40 20 70 14 90H-14C-20 70 -70 40 -70 0Z" fill={c1} {...s} />
        <path d="M-24 -70C-30 -20 -20 50 -14 90M24 -70C30 -20 20 50 14 90" fill="none" {...s} strokeWidth={3} />
        <path d="M-6 -78C-10 -10 -4 60 0 90" fill="none" stroke={c2} strokeWidth={20} opacity={0.9} />
        <path d="M-14 90L-18 118M14 90L18 118" {...fn} />
        <path d="M-20 118H20V142H-20Z" fill="#A57B57" {...s} strokeWidth={4} />
      </g>
    );
  };
  return {
    sky: sky("#7FB2F0", <path d={cloud(0.4)} fill="#FFFFFF" transform={`translate(${W.x + 60 + f * 0.4} ${W.y + 150})`} />),
    front: (
      <g opacity={life}>
        {hb(250, B * 0.3, bold.accent, "#F6CF3C", 0.9)}
        {hb(860, B * 0.8, "#3E7BD8", "#FFFFFF", 0.65)}
        {CLOUDS.map((c, i) => {
          const x = ((c.x0 + f * c.v * 2.2 + 1600) % 1600) - 260;
          return <path key={i} d={cloud(c.s)} transform={`translate(${x} ${c.y})`} fill="#FFFFFF" {...s} />;
        })}
        {lift > 0.02 ? <path d={`M165 905Q${190 + Math.sin(f / 9) * 30} ${905 - 200 * lift} 165 ${862 - 420 * lift + 40}`} {...fn} /> : null}
      </g>
    ),
    poses: { shade: { dy: -420 * lift, rot: Math.sin(f / 9) * 10 * lift } },
    cat: { prop: "balloons", propP: progress(f, 2, B * 0.6, ease.out) * life, dy: -70 * lift + Math.sin(f / 10) * 6 * lift, head: -10, lids: 0, tail: Math.sin(f / 8) * 24 },
  };
}

/* ── Tea: a dastarkhan — teapot, pialas, non, pomegranate; a suzani on the rug; warm lamp; the cat sleeps. ──── */

function tea({ f, B, life }: FxIn): FxOut {
  const item = (i: number) => pop(progress(f, 3 + i * 3, 12, ease.linear)) * life;
  const steamD = (x: number, y: number) => `M${x} ${y}C${x - 14} ${y - 30} ${x + 14} ${y - 50} ${x} ${y - 80}C${x - 12} ${y - 100} ${x + 10} ${y - 120} ${x} ${y - 140}`;
  const at = (i: number, cx: number, cy: number, el: ReactNode) => {
    const p = item(i);
    if (p <= 0) return null;
    return <g transform={`translate(${cx} ${cy}) scale(${p}) translate(${-cx} ${-cy})`}>{el}</g>;
  };
  const onTable = (
    <g transform="translate(545 1470) scale(1.3) translate(-545 -1470)">
      {at(0, 470, 1470, (
        <g>
          <path d={ellipse(470, 1470, 66, 20)} fill="#E8B862" {...s} />
          <path d={ellipse(470, 1466, 40, 11)} {...fn} fill="none" />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <circle key={k} cx={470 + Math.cos(k) * 22} cy={1466 + Math.sin(k) * 6} r={2.5} fill={INK} />
          ))}
        </g>
      ))}
      {at(1, 560, 1440, (
        <g>
          <path d="M520 1450C510 1400 610 1400 600 1450C596 1470 524 1470 520 1450Z" fill="#FFFFFF" {...s} />
          <path d="M524 1436H596" stroke="#2F5DB8" strokeWidth={8} />
          <path d="M600 1430Q630 1420 640 1398" fill="none" {...s} strokeWidth={6} />
          <path d="M520 1428Q496 1430 498 1446Q500 1460 520 1456" fill="none" {...s} strokeWidth={5} />
          <path d={ellipse(560, 1406, 20, 6)} fill="#2F5DB8" {...s} strokeWidth={3} />
        </g>
      ))}
      {at(2, 640, 1478, (
        <g>
          <path d="M616 1466Q620 1492 640 1494Q660 1492 664 1466Z" fill="#FFFFFF" {...s} strokeWidth={4} />
          <path d="M620 1474H660" stroke="#2F5DB8" strokeWidth={5} />
        </g>
      ))}
      {at(3, 690, 1462, (
        <g>
          <path d="M666 1450Q670 1476 690 1478Q710 1476 714 1450Z" fill="#FFFFFF" {...s} strokeWidth={4} />
          <path d="M670 1458H710" stroke="#2F5DB8" strokeWidth={5} />
        </g>
      ))}
      {at(4, 400, 1488, (
        <g>
          <circle cx={400} cy={1478} r={22} fill="#C8323C" {...s} strokeWidth={4} />
          <path d="M392 1458L396 1448L400 1456L404 1448L408 1458" {...fn} fill="none" />
        </g>
      ))}
      {life > 0.5 && f > 20
        ? [steamD(640, 1392), steamD(640, 1462), steamD(690, 1446)].map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeDasharray="16 14" strokeDashoffset={-f * 1.6 - i * 9} opacity={0.85} />
          ))
        : null}
    </g>
  );
  const rugP = progress(f, 0, B * 0.6, ease.out) * life;
  // A suzani laid over the rug: a red ring with blue dots and four rosettes (all in the rug's perspective).
  const rosette = (x: number, y: number, k: number) => (
    <g key={k}>
      {Array.from({ length: 8 }, (_, j) => {
        const a = (j / 8) * Math.PI * 2;
        return <path key={j} d={ellipse(x + Math.cos(a) * 26, y + Math.sin(a) * 8, 14, 5)} {...fn} fill={j % 2 ? "#C8323C" : "#E9A23B"} />;
      })}
      <path d={ellipse(x, y, 12, 5)} {...fn} fill="#2F5DB8" />
    </g>
  );
  const onRug = (
    <g opacity={rugP}>
      <path d={ellipse(540, 1562, 330, 86)} fill="none" stroke="#C8323C" strokeWidth={14} />
      <path d={ellipse(540, 1562, 330, 86)} {...fn} strokeWidth={2} />
      {Array.from({ length: 16 }, (_, j) => {
        const a = (j / 16) * Math.PI * 2;
        return <circle key={j} cx={540 + Math.cos(a) * 330} cy={1562 + Math.sin(a) * 86} r={5} fill="#2F5DB8" />;
      })}
      {[0, 1, 2, 3].map((k) => {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        return rosette(540 + Math.cos(a) * 250, 1562 + Math.sin(a) * 60, k);
      })}
    </g>
  );
  return {
    sky: sky("#5B4A8A", <path d={`M${W.x + 120} ${W.y + 70}a40 40 0 1 0 30 70a32 32 0 1 1 -30 -70Z`} fill="#FFE9A8" />),
    back: (
      <g opacity={life}>
        <defs>
          <radialGradient id="tea-glow">
            <stop offset="0%" stopColor="#FFD27A" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFD27A" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={165} cy={900} r={360} fill="url(#tea-glow)" />
      </g>
    ),
    poses: { cup: { opacity: 1 - life } },
    onTable,
    onRug,
    cat: { prop: "sleep", propP: life, lids: progress(f, 4, B * 0.5, ease.inOut), tail: Math.sin(f / 30) * 6, head: 10, beat: f / B },
  };
}

export const FX: Record<SceneKey, (i: FxIn) => FxOut> = { jungle, rain, water, space, desert, sky: skyScene, tea };
