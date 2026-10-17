import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Canvas3D } from "../effects/Canvas3D";
import { WeaveTexture } from "../effects/WeaveTexture";
import { ease, mix, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";
import { color } from "../theme/tokens";

/** «Три арки»: slow turn to −28° with a sway (R7), then on to the edge (R8). */
const ThreeArches: React.FC = () => {
  const f = useCurrentFrame();
  const { b } = useTiming();
  const turn = ease.inOut(progress(f, 0, b(3.5), ease.linear));
  const toEdge = progress(f, b(3.5), b(0.5), ease.in);
  // The sway fades out as the canvas reaches its angle, so the edge turn starts from rest.
  const sway = Math.sin((2 * Math.PI * f) / b(3)) * (1 - turn * 0.6) * (1 - toEdge);
  const rotY = mix(-28 * turn + 2.5 * sway, -90, toEdge);
  const rotX = 2 * Math.sin((2 * Math.PI * f) / b(4)) * (1 - toEdge);
  return <Canvas3D code="KZ-009" faceWidth={780} faceHeight={526} x={960} y={540} rotY={rotY} rotX={rotX} />;
};

/** «Адрас»: to the back, three staples, back to the face, into the left column (P7). */
const Adras: React.FC = () => {
  const f = useCurrentFrame();
  const { b, s } = useTiming();
  const out = progress(f, b(0.5), b(1), ease.inOut);
  const back = progress(f, b(3.5), b(1), ease.inOut);
  const shrink = progress(f, b(4.5), b(1), ease.inOut);
  const staples = [2, 2.5, 3].reduce((n, t) => n + progress(f, b(t), s(1), ease.linear), 0);
  // A small lift off the wall while turning keeps the near edge within 1.1× of the source.
  const lift = 1 - 0.07 * Math.sin(Math.PI * out) - 0.07 * Math.sin(Math.PI * back);
  return (
    <Canvas3D
      code="KZ-041"
      faceWidth={540}
      faceHeight={530}
      x={mix(960, 960 - 420 - 80, shrink)}
      y={540}
      rotY={180 * out - 180 * back}
      scale={lift * mix(1, 420 / 540, shrink)}
      staples={staples}
    />
  );
};

const Weave: React.FC = () => {
  const f = useCurrentFrame();
  const { b } = useTiming();
  const { width, height } = useVideoConfig();
  return <WeaveTexture width={width} height={height} scale={mix(2, 1, progress(f, 0, b(1.5)))} />;
};

/** Dev preview of Canvas3D and WeaveTexture; not part of the videos. */
export const Canvas3DPreview: React.FC = () => {
  const { b } = useTiming();
  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      <Sequence durationInFrames={b(4.5)}>
        <ThreeArches />
      </Sequence>
      <Sequence from={b(4.5)} durationInFrames={b(5.5)}>
        <Adras />
      </Sequence>
      <Sequence from={b(10)}>
        <Weave />
      </Sequence>
    </AbsoluteFill>
  );
};
