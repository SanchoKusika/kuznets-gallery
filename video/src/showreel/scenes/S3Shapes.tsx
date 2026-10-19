import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { shapePath, type ShapeName } from "../masks";
import { CX, CY, palette } from "../layout";
import { S3_FIRST } from "./S2Type";

const SIZE = 680;
const STEPS: { shape: ShapeName; code: string }[] = [
  { shape: "circle", code: S3_FIRST },
  { shape: "arch", code: "KZ-013" },
  { shape: "star", code: "KZ-010" },
  { shape: "hexagon", code: "KZ-148" },
];

/**
 * S3 (beats 5–9): one mask that never stops changing — circle → arch → eight-pointed star → hexagon, a new work and a
 * new colour field on every beat, outline echoes rippling out of the shape; on beat 8½ a white circle opens over it
 * all into S4. Frames relative to S3.
 */
export function S3Shapes() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const k = Math.min(STEPS.length - 1, Math.floor((frame + 5) / t.b(1)));
  // Morph to step k ends on its beat.
  const morphStart = k * t.b(1) - 5;
  const m = k === 0 ? 1 : progress(frame, morphStart, 10, ease.inOut);
  const from = STEPS[Math.max(0, k - 1)].shape;
  const to = STEPS[k].shape;
  const pic = frame >= k * t.b(1) ? k : Math.max(0, k - 1);
  const beatLocal = frame - pic * t.b(1);
  const punch = mix(1.05, 1, progress(beatLocal, 0, t.s(1) + 2, ease.out));
  const rot = frame * 0.003;
  // Entry: the shape grows out of the hole S2 opened (as a circle).
  const enter = progress(frame, 0, t.e(1), ease.out);
  const scale = mix(0.2, 1, enter) * punch;
  const size = SIZE * scale;
  const outFrom = t.b(3) + t.e(1);
  const out = progress(frame, outFrom, t.e(1), ease.in);
  const bg = palette[STEPS[pic].code].vivid;

  const d = shapePath(from, to, m, SIZE, SIZE / 2, SIZE / 2, rot);
  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2].map((i) => {
          const p = progress(beatLocal, i * 4, t.b(1) - 6, ease.out);
          if (p <= 0 || p >= 1) return null;
          return <path key={i} d={shapePath(from, to, m, size * mix(1.05, 1.9, p), CX, CY, rot)} fill="none" stroke={bold.bg} strokeWidth={5 * (1 - p) + 1} opacity={1 - p} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: CX - SIZE / 2, top: CY - SIZE / 2, width: SIZE, height: SIZE, clipPath: `path("${d}")`, scale: String(scale) }}>
        <ArtImage code={STEPS[pic].code} width={SIZE} height={SIZE} parentScale={scale} />
      </div>
      {out > 0 ? (
        <div style={{ position: "absolute", left: CX - 1300 * out, top: CY - 1300 * out, width: 2600 * out, height: 2600 * out, borderRadius: "50%", background: bold.bg }} />
      ) : null}
    </AbsoluteFill>
  );
}
