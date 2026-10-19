import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BrushStroke, type Pt } from "../../primitives/Brush";
import { MaskRise } from "../../primitives/MaskRise";
import { MorphText } from "../../primitives/MorphText";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { PaintSwap } from "../PaintSwap";
import { heavy, STAGE, TEXT_X, TEXT_Y, ZOOM_TILE } from "../layout";

const ROOMS = [
  { word: "дома", code: ZOOM_TILE.code },
  { word: "детской", code: "KZ-085" },
  { word: "офиса", code: "KZ-105" },
  { word: "кафе", code: "KZ-126" },
] as const;

const S = STAGE.size;
const X0 = STAGE.x - S / 2;
const Y0 = STAGE.y - S / 2;

/** A doodle per room, painted over the picture's corner (screen px). */
const DOODLES: Pt[][][] = [
  // home: a heart over the top-right corner
  [[[X0 + S - 40, Y0 - 10], [X0 + S - 90, Y0 - 70], [X0 + S - 150, Y0 - 40], [X0 + S - 130, Y0 + 30], [X0 + S - 40, Y0 + 100], [X0 + S + 40, Y0 + 30], [X0 + S + 60, Y0 - 40], [X0 + S + 10, Y0 - 70], [X0 + S - 40, Y0 - 10]]],
  // kids: a star over the top-left corner
  [[[X0 - 20, Y0 - 90], [X0 + 20, Y0 + 10], [X0 + 120, Y0 + 20], [X0 + 40, Y0 + 80], [X0 + 70, Y0 + 180], [X0 - 20, Y0 + 120], [X0 - 110, Y0 + 180], [X0 - 80, Y0 + 80], [X0 - 160, Y0 + 20], [X0 - 60, Y0 + 10], [X0 - 20, Y0 - 90]]],
  // office: a lightning bolt on the right edge
  [[[X0 + S + 40, Y0 + 120], [X0 + S - 30, Y0 + 290], [X0 + S + 50, Y0 + 280], [X0 + S - 20, Y0 + 460]]],
  // cafe: steam over the top edge
  [
    [[X0 + 200, Y0 + 10], [X0 + 170, Y0 - 50], [X0 + 215, Y0 - 110], [X0 + 185, Y0 - 170]],
    [[X0 + 300, Y0 + 10], [X0 + 270, Y0 - 60], [X0 + 315, Y0 - 125], [X0 + 285, Y0 - 190]],
    [[X0 + 400, Y0 + 10], [X0 + 370, Y0 - 50], [X0 + 415, Y0 - 110], [X0 + 385, Y0 - 170]],
  ],
];

/**
 * A3 (beats 8–12): «для дома / детской / офиса / кафе» — the room word melts on every beat while the picture is
 * painted over with the next one, and a brush doodle for the room lands on its corner. Frames relative to A3.
 */
export function A3Rooms() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const swaps = [1, 2, 3].map((k) => t.b(k) - t.s(1));
  const items = ROOMS.map((r, i) => ({ code: r.code, at: i === 0 ? 0 : swaps[i - 1] }));
  // A punch on every beat.
  const beatIn = frame % t.b(1);
  const punch = frame >= t.b(1) - 2 ? 1 + 0.035 * (1 - progress(beatIn, 0, t.e(1), ease.out)) : 1;
  const room = Math.min(3, Math.floor((frame + t.s(1)) / t.b(1)));
  const exit = { from: t.b(3) + t.e(1) + t.s(1), duration: t.e(1), easing: ease.menuOut };

  return (
    <AbsoluteFill>
      <PaintSwap id="a3" x={STAGE.x} y={STAGE.y} w={S} h={S} items={items} duration={t.s(1) + 4} scale={punch} />

      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {DOODLES.map((strokes, k) => {
          const from = k === 0 ? t.s(1) : swaps[k - 1] + t.e(1);
          const fade = k === room ? 1 : 1 - progress(frame, swaps[k] ?? 1e6, 4, ease.linear);
          if (k > room || fade <= 0) return null;
          return strokes.map((pts, j) => (
            <BrushStroke
              key={`${k}-${j}`}
              points={pts}
              progress={progress(frame, from + j * 2, t.e(1), ease.out)}
              width={18}
              bands={3}
              color={k === 1 ? bold.yellow : bold.accent}
              opacity={fade}
              seed={`a3-d${k}-${j}`}
            />
          ));
        })}
      </svg>

      <div style={{ position: "absolute", left: TEXT_X, top: TEXT_Y }}>
        <MaskRise from={0} duration={t.e(1)} exit={exit} style={{ paddingBottom: 6 }}>
          <div style={heavy(190)}>для</div>
        </MaskRise>
        <MaskRise from={3} duration={t.e(1)} exit={{ ...exit, from: exit.from + 2 }} style={{ paddingBottom: 6 }}>
          <MorphText texts={ROOMS.map((r) => r.word)} at={swaps.map((f) => f - 2)} duration={t.e(1) - 2} style={heavy(190, bold.accent)} blur={46} />
        </MaskRise>
      </div>
    </AbsoluteFill>
  );
}
