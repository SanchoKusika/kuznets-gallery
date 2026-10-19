import { AbsoluteFill, useCurrentFrame } from "remotion";
import { art } from "../../data/art";
import { ArtImage } from "../../primitives/ArtImage";
import { BrushStroke, Splat } from "../../primitives/Brush";
import { MaskRise } from "../../primitives/MaskRise";
import { MorphText } from "../../primitives/MorphText";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { heavy, TEXT_X, TEXT_Y } from "../layout";

type Box = { code: string; x: number; y: number; w: number; h: number; rot?: number };

const Y = 1110;
const one = (code: string): Box[] => {
  const a = art(code);
  const k = Math.min(640 / a.w, 700 / a.h, 1);
  return [{ code, x: 540, y: Y, w: Math.round(a.w * k), h: Math.round(a.h * k) }];
};
const two = (a: string, b: string): Box[] => [
  { code: a, x: 300, y: Y - 40, w: 440, h: 440, rot: -3 },
  { code: b, x: 780, y: Y + 60, w: 440, h: 440, rot: 3 },
];
const three = (a: string, b: string, c: string): Box[] => [a, b, c].map((code, i) => ({ code, x: 200 + i * 340, y: Y + (i - 1) * 50, w: 310, h: 310 }));
const quad = (codes: string[]): Box[] => codes.map((code, i) => ({ code, x: i % 2 ? 712 : 368, y: Y - 172 + Math.floor(i / 2) * 344, w: 320, h: 320 }));

/** Ten shots, one per eighth; the last one (the balloon) stays for A7 to fold into the logo's dot. */
export const SHOTS: Box[][] = [
  one("KZ-047"),
  two("KZ-121", "KZ-122"),
  one("KZ-070"),
  quad(["KZ-040", "KZ-041", "KZ-042", "KZ-064"]),
  one("KZ-001"),
  three("KZ-084", "KZ-096", "KZ-092"),
  two("KZ-113", "KZ-112"),
  one("KZ-050"),
  quad(["KZ-148", "KZ-139", "KZ-156", "KZ-149"]),
  one("KZ-134"),
];

/**
 * A6 (beats 19–24): a montage on the eighths — one picture, two, three, four, big and small, each landing with a
 * punch and a fleck of paint — under «в наличии → и на заказ → от 90 000 сум → доставка по узбекистану».
 * Frames relative to A6.
 */
export function A6Montage() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const shotLen = t.e(1);
  const k = Math.min(SHOTS.length - 1, Math.floor(frame / shotLen));
  const local = frame - k * shotLen;
  const punch = mix(1.1, 1, progress(local, 0, t.s(1) + 2, ease.out));
  const paintP = progress(local, 2, t.s(1), ease.out);
  const exit = { from: t.b(4) + t.e(1), duration: t.e(1), easing: ease.menuOut };
  const morphs = [t.b(1) + t.s(1), t.b(2) + t.e(1), t.b(3) + t.s(3)];
  const shot = SHOTS[k];
  // Paint: a splat on odd shots, a yellow swipe under the pictures on even ones.
  const last = shot[shot.length - 1];
  const bottom = Math.max(...shot.map((b) => b.y + b.h / 2));

  return (
    <AbsoluteFill>
      {shot.map((b, i) => (
        <div
          key={`${k}-${i}`}
          style={{ position: "absolute", left: b.x - b.w / 2, top: b.y - b.h / 2, scale: String(punch * (1 - 0.02 * i)), rotate: `${b.rot ?? 0}deg` }}
        >
          <ArtImage code={b.code} width={b.w} height={b.h} parentScale={punch} fast />
        </div>
      ))}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {k % 2 ? (
          <Splat x={last.x + last.w / 2 - 20} y={last.y - last.h / 2 + 30} r={38} p={paintP} color={bold.accent} seed={`a6-s${k}`} angle={-0.7} />
        ) : (
          <BrushStroke
            points={[[180, bottom + 40], [540, bottom + 28], [900, bottom + 36]]}
            progress={paintP}
            width={40}
            color={k % 4 ? bold.yellow : bold.accent}
            seed={`a6-b${k}`}
          />
        )}
      </svg>
      <div style={{ position: "absolute", left: TEXT_X, top: TEXT_Y }}>
        <MaskRise from={0} duration={t.e(1)} exit={exit} style={{ paddingBottom: 8 }}>
          <MorphText
            texts={["в наличии", "и на заказ", "от 90 000 сум", "доставка\nпо узбекистану"]}
            at={morphs}
            duration={t.e(1) - 2}
            style={heavy(130)}
            blur={36}
          />
        </MaskRise>
      </div>
    </AbsoluteFill>
  );
}
