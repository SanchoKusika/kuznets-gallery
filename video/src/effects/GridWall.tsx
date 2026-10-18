import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ArtImage } from "../primitives/ArtImage";
import { ease, mix, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";

/** Grid geometry in px; `left`/`top` omitted → the grid is centred on the composition on that axis. */
export type GridLayout = { cols: number; rows: number; tile: number; gap: number; left?: number; top?: number };

/** R5: 5 × 10, tile 196, gap 12, margins 24 (lower rows run off the bottom). */
export const GRID_REELS: GridLayout = { cols: 5, rows: 10, tile: 196, gap: 12, left: 24, top: 24 };
/** P6: 11 × 6, tile 150, gap 12, centred on 1920×1080. */
export const GRID_PROMO: GridLayout = { cols: 11, rows: 6, tile: 150, gap: 12 };

/** Wave numbers of the brief, in 60 fps frames (scaled by fps / 60 so a 50 fps master keeps the same time). */
const FILL_TILE = 14;
const EXIT_STEP = 2;
const EXIT_TILE = 10;

const diagonals = (l: GridLayout) => l.cols + l.rows - 1;

/** Frames the reverse exit wave takes for this layout (use it to end the wave on a beat: exitFrom = end − this). */
export const gridExitDuration = (l: GridLayout, fps: number) => ((diagonals(l) - 1) * EXIT_STEP + EXIT_TILE) * (fps / 60);

/** Frames the fill wave takes for this layout and step (60 fps frames). */
export const gridFillDuration = (l: GridLayout, fps: number, step = 4) => ((diagonals(l) - 1) * step + FILL_TILE) * (fps / 60);

type Props = {
  /** Works in reading order; one per tile (repeats if shorter). Never excluded works — `art()` throws on them. */
  codes: readonly string[];
  layout: GridLayout;
  /** Fill wave start (frame relative to the Sequence). */
  fillFrom?: number;
  /** Delay between diagonals, in 60 fps frames (R5: 4, P6: 2). */
  step?: number;
  /** Whole grid settles 1.06 → 1.0 over [settleFrom, settleFrom + settleDuration] (default: the fill start, 1 bar). */
  settleFrom?: number;
  settleDuration?: number;
  settleScale?: number;
  /** Reverse diagonal fade-out start; omitted → the tiles stay. */
  exitFrom?: number;
  /** Product of ancestor scales (P6 camera pull-back), for the 1.1× check. */
  parentScale?: number;
  /** A tile kept empty until a frame (a work flying in lands there). */
  hold?: { index: number; until: number };
};

/** Centre and side of a tile on screen at a frame, with the grid's settle scale (where a flying work must land). */
export function gridTileAt(layout: GridLayout, index: number, frame: number, width: number, height: number, settle: { from: number; duration: number; scale?: number }) {
  const { cols, rows, tile, gap } = layout;
  const gridW = cols * tile + (cols - 1) * gap;
  const gridH = rows * tile + (rows - 1) * gap;
  const left = layout.left ?? (width - gridW) / 2;
  const top = layout.top ?? (height - gridH) / 2;
  const s = mix(settle.scale ?? 1.06, 1, progress(frame, settle.from, settle.duration, ease.out));
  const cx = left + (index % cols) * (tile + gap) + tile / 2;
  const cy = top + Math.floor(index / cols) * (tile + gap) + tile / 2;
  return { x: width / 2 + (cx - width / 2) * s, y: height / 2 + (cy - height / 2) * s, size: tile * s };
}

/**
 * A showroom wall of square centre crops (brief 6.3 GridWall, R5 / P6): tiles appear by a diagonal wave
 * (scale 0.92 → 1, opacity 0 → 1, ease-out), the whole grid slowly settles from 1.06, and can leave by a
 * reverse diagonal wave (bottom-right first). Transparent background — the scene supplies the wall.
 */
export function GridWall({
  codes,
  layout,
  fillFrom = 0,
  step = 4,
  settleFrom,
  settleDuration,
  settleScale = 1.06,
  exitFrom,
  parentScale = 1,
  hold,
}: Props) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { bar } = useTiming();
  const k = fps / 60;
  const { cols, rows, tile, gap } = layout;
  const gridW = cols * tile + (cols - 1) * gap;
  const gridH = rows * tile + (rows - 1) * gap;
  const left = layout.left ?? (width - gridW) / 2;
  const top = layout.top ?? (height - gridH) / 2;
  const last = diagonals(layout) - 1;

  const settle = progress(frame, settleFrom ?? fillFrom, settleDuration ?? bar(1), ease.out);
  const gridScale = mix(settleScale, 1, settle);

  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const d = r + c;
      const inP = progress(frame, fillFrom + d * step * k, FILL_TILE * k, ease.out);
      const outP = exitFrom === undefined ? 0 : progress(frame, exitFrom + (last - d) * EXIT_STEP * k, EXIT_TILE * k, ease.out);
      const opacity = inP * (1 - outP);
      if (opacity <= 0 || (hold && hold.index === i && frame < hold.until)) continue;
      const s = mix(0.92, 1, inP);
      tiles.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: left + c * (tile + gap),
            top: top + r * (tile + gap),
            width: tile,
            height: tile,
            opacity,
            scale: String(s),
          }}
        >
          <ArtImage code={codes[i % codes.length]} width={tile} height={tile} parentScale={parentScale * gridScale * s} />
        </div>,
      );
    }
  }

  return <AbsoluteFill style={{ scale: String(gridScale), transformOrigin: "50% 50%" }}>{tiles}</AbsoluteFill>;
}
