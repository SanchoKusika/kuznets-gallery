import { AbsoluteFill, Sequence } from "remotion";
import { Soundtrack } from "../audio/Soundtrack";
import { Wall } from "../primitives/Wall";
import { useTiming } from "../theme/timing";
import { color } from "../theme/tokens";
import { sceneStarts } from "./layout";
import { ActWorld } from "./scenes/ActWorld";
import { P5Shapes } from "./scenes/P5Shapes";
import { P6Showroom } from "./scenes/P6Showroom";
import { P7Craft } from "./scenes/P7Craft";
import { P8Steps } from "./scenes/P8Steps";
import { P10Final } from "./scenes/P10Final";

/**
 * Promo 1920×1080, 20 bars (brief 8; the owner cut P9, the reviews). P1–P4 run on one long wall under one camera;
 * from P5 on each scene has the screen to itself. No showroom footage (the owner has none): P6 draws it in line.
 */
export const Promo: React.FC = () => {
  const t = useTiming();
  const S = sceneStarts(t);
  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      <Wall />
      <Sequence name="P1–P4 стена" durationInFrames={S.P5}>
        <ActWorld />
      </Sequence>
      <Sequence name="P5 по форме" from={S.P5} durationInFrames={S.P6 - S.P5}>
        <P5Shapes />
      </Sequence>
      <Sequence name="P6 стена и шоурум" from={S.P6} durationInFrames={S.P7 - S.P6}>
        <P6Showroom />
      </Sequence>
      <Sequence name="P7 ремесло" from={S.P7} durationInFrames={S.P8 - S.P7} premountFor={t.b(1)}>
        <P7Craft />
      </Sequence>
      {/* P8 holds under P10's curtains. */}
      <Sequence name="P8 по вашей идее" from={S.P8} durationInFrames={S.P10 - S.P8 + t.b(1)}>
        <P8Steps />
      </Sequence>
      <Sequence name="P10–P11 логотип и финал" from={S.P10}>
        <P10Final />
      </Sequence>
      <Soundtrack video="promo" />
    </AbsoluteFill>
  );
};
