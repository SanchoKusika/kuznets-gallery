import { useMemo } from "react";
import { random } from "remotion";
import { color } from "../theme/tokens";

type Props = {
  width: number;
  height: number;
  /** Zoom of the weave around (originX, originY); vector, so 2.0 is as crisp as 1.0. */
  scale?: number;
  opacity?: number;
  /** Thread pitch at scale 1, px. */
  pitch?: number;
  /** Zoom origin, px; default — the centre. */
  originX?: number;
  originY?: number;
  seed?: string;
  style?: React.CSSProperties;
};

/** Threads per tile; the tint bands use other periods, so the repeat does not show. */
const TILE = 24;
const BAND_X = 37;
const BAND_Y = 29;

/**
 * Plain-weave canvas (brief 6.3): warp and weft threads crossing over and under, paper colours with
 * deterministic per-thread tone and slubs (`random(seed)`). Drawn as SVG patterns in thread units.
 */
export function WeaveTexture({ width, height, scale = 1, opacity = 1, pitch = 9, originX, originY, seed = "weave", style }: Props) {
  const ox = originX ?? width / 2;
  const oy = originY ?? height / 2;
  const id = `weave-${seed}`;

  const tile = useMemo(() => {
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < TILE; i++) {
      for (let j = 0; j < TILE; j++) {
        const warpUp = (i + j) % 2 === 0;
        // Per-thread tone plus a little per-crossing slub: one random per thread, one per cell.
        const toneThread = random(`${seed}-${warpUp ? "w" : "f"}-${warpUp ? i : j}`);
        const slub = random(`${seed}-c-${i}-${j}`);
        const w = 0.84 + 0.1 * slub;
        const dark = toneThread < 0.5;
        const tint = dark ? (0.5 - toneThread) * 0.1 : (toneThread - 0.5) * 0.8;
        const key = `${i}-${j}`;
        if (warpUp) {
          const x = i + (1 - w) / 2;
          cells.push(
            <g key={key}>
              <rect x={x} y={j - 0.06} width={w} height={1.12} rx={w * 0.42} fill={`url(#${id}-v)`} />
              <rect x={x} y={j - 0.06} width={w} height={1.12} rx={w * 0.42} fill={dark ? color.ink : color.paperRaised} opacity={tint} />
            </g>,
          );
        } else {
          const y = j + (1 - w) / 2;
          cells.push(
            <g key={key}>
              <rect x={i - 0.06} y={y} width={1.12} height={w} rx={w * 0.42} fill={`url(#${id}-h)`} />
              <rect x={i - 0.06} y={y} width={1.12} height={w} rx={w * 0.42} fill={dark ? color.ink : color.paperRaised} opacity={tint} />
            </g>,
          );
        }
      }
    }
    return cells;
  }, [id, seed]);

  const under = useMemo(
    () =>
      Array.from({ length: TILE }, (_, i) => [
        <rect key={`u${i}`} x={i + 0.06} width={0.88} height={TILE} fill={color.paper2} />,
        <rect key={`v${i}`} y={i + 0.06} height={0.88} width={TILE} fill={color.paper2} />,
      ]),
    [],
  );

  // Wide, faint bands: uneven thread thickness across the cloth.
  const bands = useMemo(() => {
    const cols = Array.from({ length: BAND_X }, (_, i) => random(`${seed}-bx-${i}`));
    const rows = Array.from({ length: BAND_Y }, (_, j) => random(`${seed}-by-${j}`));
    return { cols, rows };
  }, [seed]);

  // Zoom about the origin, then thread units → px.
  const t = `translate(${ox} ${oy}) scale(${scale}) translate(${-ox} ${-oy}) scale(${pitch})`;
  // The visible area in thread units, with a margin of one thread.
  const cover = {
    x: (ox - ox / scale) / pitch - 1,
    y: (oy - oy / scale) / pitch - 1,
    width: width / scale / pitch + 2,
    height: height / scale / pitch + 2,
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", opacity, ...style }}>
      <defs>
        {/* Round threads: lit in the middle, falling into the gaps at the sides. */}
        <linearGradient id={`${id}-v`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color.paper2} />
          <stop offset="0.4" stopColor={color.paperRaised} />
          <stop offset="1" stopColor={color.paper2} />
        </linearGradient>
        <linearGradient id={`${id}-h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color.paper2} />
          <stop offset="0.4" stopColor={color.paperRaised} />
          <stop offset="1" stopColor={color.paper2} />
        </linearGradient>
        <pattern id={`${id}-tile`} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          {/* Gaps, then the threads running underneath, then the crossings on top. */}
          <rect width={TILE} height={TILE} fill={color.paper3} />
          {under}
          {tile}
        </pattern>
        <pattern id={`${id}-bx`} width={BAND_X} height={1} patternUnits="userSpaceOnUse">
          {bands.cols.map((r, i) => (
            <rect key={i} x={i} width={1} height={1} fill={r < 0.5 ? color.ink : color.paperRaised} opacity={r < 0.5 ? r * 0.05 : (r - 0.5) * 0.25} />
          ))}
        </pattern>
        <pattern id={`${id}-by`} width={1} height={BAND_Y} patternUnits="userSpaceOnUse">
          {bands.rows.map((r, j) => (
            <rect key={j} y={j} width={1} height={1} fill={r < 0.5 ? color.ink : color.paperRaised} opacity={r < 0.5 ? r * 0.05 : (r - 0.5) * 0.25} />
          ))}
        </pattern>
      </defs>
      <rect width={width} height={height} fill={color.paper} />
      <g transform={t}>
        {/* Cover the frame in thread units, whatever the zoom. */}
        <rect {...cover} fill={`url(#${id}-tile)`} />
        <rect {...cover} fill={`url(#${id}-bx)`} />
        <rect {...cover} fill={`url(#${id}-by)`} />
      </g>
    </svg>
  );
}
