import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import { Soundtrack } from "../audio/Soundtrack";
import { SafeZone } from "../primitives/SafeZone";
import { Wall } from "../primitives/Wall";
import { useTiming } from "../theme/timing";
import { color } from "../theme/tokens";
import { ActCustom, ACT_CUSTOM_LENGTH } from "./scenes/ActCustom";
import { ActFrame, ACT_FRAME_TAIL } from "./scenes/ActFrame";
import { ActLogo } from "./scenes/ActLogo";
import { ActWall } from "./scenes/ActWall";

export const reelsSchema = z.object({
  /** Meta safe zone overlay (brief 5.7). */
  showGuides: z.boolean(),
});

export type ReelsProps = z.infer<typeof reelsSchema>;

/**
 * Reels 1080×1920, 10 bars (brief 7; the owner cut R7, the reviews). The wall with its window shadow runs under the whole video (its drift
 * period is the video, so the loop is seamless); the scenes come in four acts, each in its own Sequence:
 * R1–R3 the frame on the nail, R4–R5 circles and the wall, R6 the custom work, R8 the logo.
 */
export const Reels: React.FC<ReelsProps> = ({ showGuides }) => {
  const t = useTiming();
  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      <Wall windowShadow />
      {/* The frame and the interior fade out over R4's first frames, under the opening circle. */}
      <Sequence name="R1–R3 рама" durationInFrames={t.bar(4) + ACT_FRAME_TAIL(t)}>
        <ActFrame />
      </Sequence>
      <Sequence name="R4–R5 круги и стена" from={t.bar(4)} durationInFrames={t.bar(2)}>
        <ActWall />
      </Sequence>
      <Sequence name="R6 на заказ" from={t.bar(6)} durationInFrames={ACT_CUSTOM_LENGTH(t)}>
        <ActCustom />
      </Sequence>
      <Sequence name="R8 логотип" from={t.bar(7)} durationInFrames={t.bar(3)}>
        <ActLogo />
      </Sequence>
      <Soundtrack video="reels" />
      {showGuides ? <SafeZone /> : null}
    </AbsoluteFill>
  );
};
