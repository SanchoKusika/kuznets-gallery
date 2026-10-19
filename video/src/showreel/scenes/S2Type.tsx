import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { ease, mix, progress } from "../../theme/easing";
import { fonts } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { palette } from "../layout";

const WORD = "KUZNETSOVS";
/** A picture inside every letter. */
const CODES = ["KZ-010", "KZ-143", "KZ-070", "KZ-047", "KZ-012", "KZ-121", "KZ-031", "KZ-097", "KZ-064", "KZ-089"];
const CELL_W = 200;
const CELL_H = 300;
const SIZE = 290;
const ROW_Y = [770, 1110];
const cell = (i: number) => {
  const row = i < 5 ? 0 : 1;
  const col = i % 5;
  return { x: 40 + col * CELL_W, y: ROW_Y[row] - CELL_H / 2 };
};
/** The «O» the camera dives through, and its counter (hole) in letter-cell coordinates. */
const O_INDEX = 7;
// The hole is drawn under the letters and larger than the counter: the «O» itself trims it to the counter's shape.
const O_HOLE = { x: CELL_W / 2, y: CELL_H * 0.5, r: 88 };
/** The first work of S3 — its colour is what shows through the hole. */
export const S3_FIRST = "KZ-031";

/**
 * S2 (beats 2–5), on the logo's yellow: KUZNETSOVS slams in letter by letter, each glyph a window onto a different
 * work; on beat 4 the camera dives into the «O» and its counter opens onto S3's colour. Frames relative to S2.
 */
export function S2Type() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const step = 4;
  const diveFrom = t.b(2);
  const dive = progress(frame, diveFrom, t.b(1), ease.in);
  const z = mix(1, 26, dive ** 1.6);
  const o = cell(O_INDEX);
  const ox = o.x + O_HOLE.x;
  const oy = o.y + O_HOLE.y;
  // It starts as a dot in the «O» — the logo's own idea — and fills the counter.
  const holeR = O_HOLE.r * progress(frame, diveFrom - 6, 8, ease.out);

  return (
    <AbsoluteFill style={{ background: bold.yellow }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${ox}px ${oy}px`, scale: String(z) }}>
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            {WORD.split("").map((ch, i) => (
              <clipPath key={i} id={`s2-glyph-${i}`} clipPathUnits="userSpaceOnUse">
                <text x={CELL_W / 2} y={CELL_H * 0.84} textAnchor="middle" style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: SIZE }}>
                  {ch}
                </text>
              </clipPath>
            ))}
          </defs>
        </svg>
        {holeR > 0 ? (
          <div style={{ position: "absolute", left: ox - holeR, top: oy - holeR, width: holeR * 2, height: holeR * 2, borderRadius: "50%", background: palette[S3_FIRST].vivid }} />
        ) : null}
        {WORD.split("").map((ch, i) => {
          const from = i * step;
          const p = progress(frame, from, t.e(1) - 2, ease.out);
          if (p <= 0) return null;
          const c = cell(i);
          const rot = (random(`s2-r${i}`) - 0.5) * 30 * (1 - p);
          const s = mix(1.9, 1, p);
          // The picture drifts inside its letter.
          const drift = (frame - from) * 0.6 * (i % 2 ? 1 : -1);
          // On the dive the pictures leave the letters (they would be blown up far past their size).
          const pic = 1 - progress(frame, diveFrom, 4, ease.linear);
          return (
            <div
              key={i}
              style={{ position: "absolute", left: c.x, top: c.y, width: CELL_W, height: CELL_H, clipPath: `url(#s2-glyph-${i})`, scale: String(s), rotate: `${rot}deg`, opacity: Math.min(1, p * 3) }}
            >
              <div style={{ position: "absolute", left: -60, top: -40 + drift * 0.3, width: CELL_W + 120, height: CELL_H + 80, background: bold.ink }}>
                {pic > 0 ? <ArtImage code={CODES[i]} width={CELL_W + 120} height={CELL_H + 80} parentScale={s} fast style={{ opacity: pic }} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
