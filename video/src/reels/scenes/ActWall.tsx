import { Sequence, useVideoConfig } from "remotion";
import { copy } from "../../data/copy";
import { WORKS_COUNT } from "../../data/art";
import { reels, WALL_LANDING_TILE } from "../../data/selection";
import { CircleMontage } from "../../effects/CircleMontage";
import { GRID_REELS, GridWall, gridExitDuration, gridTileAt } from "../../effects/GridWall";
import { useCounter } from "../../primitives/Counter";
import { MaskRise } from "../../primitives/MaskRise";
import { ease } from "../../theme/easing";
import { display, serif, tabular } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { color } from "../../theme/tokens";
import { CIRCLE } from "../layout";

/**
 * R4–R5 (bars 5–6, the drop): works change inside a fixed circle on every eighth, then the mask opens to the
 * edges onto the showroom wall, which has been filling since R4 +3b behind it; the counter plate, then the wall
 * leaves by a reverse diagonal wave that ends on the last frame of R5.
 */
export function ActWall() {
  const { fps, width, height } = useVideoConfig();
  const t = useTiming();
  // The grid starts 1b before the mask opens, so its wave has reached the circle when it does (one GridWall
  // in both scenes: the same element under the circle in R4 and on its own in R5).
  const lead = t.b(1);
  const life = lead + t.bar(1);
  // The last circle work lands in its tile exactly as R5 starts (grid frame = lead).
  const tile = gridTileAt(GRID_REELS, WALL_LANDING_TILE, lead, width, height, { from: 0, duration: life });
  const grid = (
    <GridWall
      codes={reels.wall}
      layout={GRID_REELS}
      settleDuration={life}
      exitFrom={life - gridExitDuration(GRID_REELS, fps)}
      hold={{ index: WALL_LANDING_TILE, until: lead }}
    />
  );
  return (
    <>
      <Sequence name="R4 круги" durationInFrames={t.bar(1)}>
        <CircleMontage
          codes={reels.circles}
          diameter={CIRCLE.d}
          x={CIRCLE.x}
          y={CIRCLE.y}
          expand={{ from: t.b(3.5), duration: t.b(0.5) }}
          land={{ from: t.b(3.5), duration: t.b(0.5), ...tile }}
        >
          <Sequence from={t.b(4) - lead}>{grid}</Sequence>
        </CircleMontage>
      </Sequence>
      <Sequence name="R5 стена" from={t.bar(1)} durationInFrames={t.bar(1)}>
        <Sequence from={-lead}>{grid}</Sequence>
        <CounterPlate />
      </Sequence>
    </>
  );
}

/** Paper plate in the middle of the safe zone (y ≈ 620–880): «159 авторских работ» counted up, «больше их нигде нет». */
function CounterPlate() {
  const t = useTiming();
  const n = useCounter(WORKS_COUNT, t.b(1), t.b(1.5));
  // The word form is the final one all along and the number keeps its final width: nothing jumps while it counts.
  const digits = String(WORKS_COUNT).length;
  const words = copy.reels.wallTitle(WORKS_COUNT).slice(digits);
  return (
    <MaskRise
      from={t.b(1)}
      duration={t.b(1)}
      exit={{ from: t.b(3.5), duration: t.b(0.5), easing: ease.inOut, to: "down" }}
      style={{ position: "absolute", left: 540, top: 750, translate: "-50% -50%" }}
      innerStyle={{ background: color.paper, padding: 40, textAlign: "center", whiteSpace: "nowrap" }}
    >
      <div style={{ ...display(84, 600, -0.04), ...tabular, color: color.ink }}>
        <span style={{ display: "inline-block", width: `${digits}ch`, textAlign: "right" }}>{n}</span>
        {words}
      </div>
      <div style={{ ...serif(40), color: color.ink2, marginTop: 14 }}>{copy.reels.wallSub}</div>
    </MaskRise>
  );
}
