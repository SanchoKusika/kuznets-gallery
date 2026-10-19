import type { ReactNode } from "react";
import { circle, cushion, ellipse, leaf, rr } from "../lines/shapes";
import { BACK, FINE, INK, LINE, persp, WIN } from "./layout";

// The room itself: shell, floor boards, window, sofa, lamp, plant, rug, coffee table and cup — ink lines on neutral
// greys (each scene tints them from above). Every piece is its own group, so a scene can move it (zero gravity,
// a floating lamp shade) without redrawing it.

export type Pose = { dx?: number; dy?: number; rot?: number; scale?: number; opacity?: number };
export type Poses = Partial<Record<"sofa" | "lamp" | "shade" | "plant" | "table" | "cup" | "rug", Pose>>;

const C = {
  ceiling: "#F1EFEB",
  side: "#DCD8D1",
  back: "#E9E6E0",
  floor: "#CFC8BC",
  sofa: "#B9B2A8",
  seat: "#C9C3BA",
  arm: "#B0A99F",
  base: "#A49D93",
  cushion: "#DCD5CB",
  wood: "#A57B57",
  pot: "#C27B5A",
  leaf: "#6E9E58",
  shade: "#EADFC8",
  rug: "#D8CBB8",
  sky: "#D3E6F0",
  cup: "#F4F1EC",
} as const;

const P = (pts: [number, number][]) => "M" + pts.map(([x, y]) => `${x} ${y}`).join("L") + "Z";
const stroke = { stroke: INK, strokeWidth: LINE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const fine = { stroke: INK, strokeWidth: FINE, strokeLinecap: "round" as const, fill: "none" };

/** A group moved by its pose about a pivot. */
function G({ pose, pivot, children }: { pose?: Pose; pivot: [number, number]; children: ReactNode }) {
  if (!pose) return <g>{children}</g>;
  const { dx = 0, dy = 0, rot = 0, scale = 1, opacity = 1 } = pose;
  return (
    <g opacity={opacity} transform={`translate(${dx} ${dy}) rotate(${rot} ${pivot[0]} ${pivot[1]}) translate(${pivot[0]} ${pivot[1]}) scale(${scale}) translate(${-pivot[0]} ${-pivot[1]})`}>
      {children}
    </g>
  );
}

const boards = Array.from({ length: 9 }, (_, i) => {
  const x = BACK.x0 + ((i + 1) * (BACK.x1 - BACK.x0)) / 10;
  const k = (1920 - 900) / (BACK.y1 - 900);
  return { a: [x, BACK.y1] as const, b: persp(x, BACK.y1, k) };
});

/** Shell: ceiling, side walls, back wall, floor and its boards. */
export function Shell() {
  return (
    <g>
      <path d={P([[0, 0], [1080, 0], [1080, 398], [BACK.x1, BACK.y0], [BACK.x0, BACK.y0], [0, 398]])} fill={C.ceiling} />
      <path d={P([[0, 398], [BACK.x0, BACK.y0], [BACK.x0, BACK.y1], [0, 1870]])} fill={C.side} />
      <path d={P([[1080, 398], [BACK.x1, BACK.y0], [BACK.x1, BACK.y1], [1080, 1870]])} fill={C.side} />
      <rect x={BACK.x0} y={BACK.y0} width={BACK.x1 - BACK.x0} height={BACK.y1 - BACK.y0} fill={C.back} />
      <path d={P([[BACK.x0, BACK.y1], [BACK.x1, BACK.y1], [1080, 1870], [1080, 1920], [0, 1920], [0, 1870]])} fill={C.floor} />
      {boards.map(({ a, b }, i) => (
        <path key={i} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} {...fine} opacity={0.45} />
      ))}
      <path d={`M${BACK.x0} ${BACK.y1 - 18}H${BACK.x1}`} {...fine} />
      <path d={`M0 398L${BACK.x0} ${BACK.y0}H${BACK.x1}L1080 398M${BACK.x0} ${BACK.y0}V${BACK.y1}H${BACK.x1}V${BACK.y0}M${BACK.x0} ${BACK.y1}L0 1870M${BACK.x1} ${BACK.y1}L1080 1870`} fill="none" {...stroke} />
    </g>
  );
}

/** The window: frame, mullions and a sill; `sky` is drawn inside the glass. */
export function Window({ sky }: { sky?: ReactNode }) {
  const { x0, x1, y0, y1 } = WIN;
  const mx = (x0 + x1) / 2;
  const my = y0 + (y1 - y0) * 0.42;
  return (
    <g>
      <defs>
        <clipPath id="room-glass">
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.sky} />
      <g clipPath="url(#room-glass)">{sky}</g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" {...stroke} />
      <rect x={x0 + 12} y={y0 + 12} width={x1 - x0 - 24} height={y1 - y0 - 24} {...fine} />
      <path d={`M${mx} ${y0}V${y1}M${x0} ${my}H${x1}`} {...stroke} strokeWidth={LINE - 1} fill="none" />
      <path d={rr(x0 - 18, y1, x1 - x0 + 36, 18, 4)} fill={C.cup} {...stroke} />
    </g>
  );
}

/** Rug, coffee table, sofa, lamp, plant and cup, each movable; scenes can lay things on the rug and the table. */
export function Furniture({ poses = {}, onRug, onTable }: { poses?: Poses; onRug?: ReactNode; onTable?: ReactNode }) {
  return (
    <g>
      <G pose={poses.rug} pivot={[540, 1560]}>
        <path d={ellipse(540, 1560, 430, 120)} fill={C.rug} {...stroke} />
        <path d={ellipse(540, 1560, 380, 98)} {...fine} />
      </G>
      {onRug}
      <G pose={poses.sofa} pivot={[520, 1200]}>
        <path d={rr(232, 1068, 576, 150, 34)} fill={C.sofa} {...stroke} />
        <path d={rr(214, 1236, 612, 72, 14)} fill={C.base} {...stroke} />
        <path d={rr(258, 1176, 262, 70, 18)} fill={C.seat} {...stroke} />
        <path d={rr(520, 1176, 262, 70, 18)} fill={C.seat} {...stroke} />
        <path d={rr(196, 1120, 76, 186, 30)} fill={C.arm} {...stroke} />
        <path d={rr(768, 1120, 76, 186, 30)} fill={C.arm} {...stroke} />
        <path d={cushion(330, 1140, 96, -6)} fill={C.cushion} {...stroke} />
        <path d="M250 1308L244 1336M790 1308L796 1336" {...stroke} fill="none" />
      </G>
      <G pose={poses.lamp} pivot={[165, 1150]}>
        <path d={ellipse(165, 1396, 52, 14)} fill="#5A5650" {...stroke} />
        <path d="M165 1392V905" {...stroke} fill="none" />
      </G>
      <G pose={poses.shade} pivot={[165, 862]}>
        <path d={P([[112, 820], [218, 820], [242, 905], [88, 905]])} fill={C.shade} {...stroke} />
      </G>
      <G pose={poses.plant} pivot={[905, 1300]}>
        {[
          [-48, 190, 46],
          [-18, 230, 52],
          [14, 210, 50],
          [42, 180, 44],
          [-70, 140, 36],
          [66, 140, 36],
        ].map(([a, l, w], i) => (
          <path key={i} d={leaf(905, 1335, a, l, w)} fill={C.leaf} {...stroke} strokeWidth={LINE - 1} />
        ))}
        <path d={P([[858, 1330], [952, 1330], [940, 1432], [870, 1432]])} fill={C.pot} {...stroke} />
      </G>
      <G pose={poses.table} pivot={[540, 1520]}>
        <path d="M430 1492L420 1592M650 1492L660 1592M540 1514V1606" {...stroke} fill="none" />
        <path d={ellipse(540, 1482, 172, 40)} fill={C.wood} {...stroke} />
      </G>
      {onTable}
      <G pose={poses.cup} pivot={[602, 1446]}>
        <path d={rr(582, 1424, 40, 36, 7)} fill={C.cup} {...stroke} strokeWidth={LINE - 1} />
        <path d={circle(628, 1440, 9)} fill="none" {...stroke} strokeWidth={LINE - 2} />
      </G>
    </g>
  );
}
