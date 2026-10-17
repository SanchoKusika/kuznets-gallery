import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { reels } from "../data/selection";
import { CircleMontage } from "../effects/CircleMontage";
import { GRID_REELS, GridWall, gridExitDuration } from "../effects/GridWall";
import { useTiming } from "../theme/timing";
import { color } from "../theme/tokens";

/**
 * Dev preview (owned by one task); not part of the videos.
 * Bar 1 = R4 circle montage, its mask expanding over +3.5b…+4b onto the grid; bar 2 = R5 grid wall.
 * The grid starts 1b before the expansion, so its diagonal wave has reached the circle when the mask opens,
 * and it is the same GridWall in both bars (shifted Sequences), so the cut is seamless.
 */
export const GridCirclesPreview: React.FC = () => {
  const { fps } = useVideoConfig();
  const { b, bar } = useTiming();
  const lead = b(1);
  const life = lead + bar(1);
  const grid = (
    <GridWall
      codes={reels.wall}
      layout={GRID_REELS}
      settleDuration={life}
      exitFrom={life - gridExitDuration(GRID_REELS, fps)}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      <Sequence durationInFrames={bar(1)}>
        <CircleMontage codes={reels.circles} diameter={440} x={540} y={760} expand={{ from: b(3.5), duration: b(0.5) }}>
          <Sequence from={b(4) - lead}>{grid}</Sequence>
        </CircleMontage>
      </Sequence>
      <Sequence from={bar(1)} durationInFrames={bar(1)}>
        <Sequence from={-lead}>{grid}</Sequence>
      </Sequence>
    </AbsoluteFill>
  );
};
