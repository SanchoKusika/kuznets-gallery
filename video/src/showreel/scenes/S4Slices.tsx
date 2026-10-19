import { AbsoluteFill, useCurrentFrame } from "remotion";
import { art } from "../../data/art";
import { ArtImage, coverCrop, type Crop } from "../../primitives/ArtImage";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { CX, CY } from "../layout";
import { S5_BG } from "./S5Ring";

const S = 680;
const X0 = CX - S / 2;
const Y0 = CY - S / 2;
const CODES = ["KZ-061", "KZ-097", "KZ-076", "KZ-099"] as const;

/** Source crop of a sub-box (bx, by, bw, bh in box px) of the picture shown cover-cropped in the S×S box. */
const sub = (code: string, bx: number, by: number, bw: number, bh: number): Crop => {
  const a = art(code);
  const c = coverCrop(a.w, a.h, 1);
  const k = c.w / S;
  return { x: c.x + bx * k, y: c.y + by * k, w: bw * k, h: bh * k };
};

function Piece({ code, bx, by, bw, bh, dx = 0, dy = 0, style }: { code: string; bx: number; by: number; bw: number; bh: number; dx?: number; dy?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "absolute", left: X0 + bx + dx, top: Y0 + by + dy, width: bw, height: bh, ...style }}>
      <ArtImage code={code} width={bw} height={bh} crop={sub(code, bx, by, bw, bh)} />
    </div>
  );
}

/**
 * S4 (beats 9–13), on white: one box, four ways to change what is in it — eight strips fly in from above and below,
 * the next work drops in strip by strip, the third slides in in rows from both sides, the fourth arrives by a
 * diagonal wave of 4×4 tiles flipping over in 3D. Then the box spins away. Frames relative to S4.
 */
export function S4Slices() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const B = t.b(1);
  const strips = 8;
  const sw = S / strips;
  const stage = Math.min(3, Math.floor(frame / B));
  const local = frame - stage * B;
  const exitP = progress(frame, t.b(3) + t.e(1) + t.s(1), t.s(1) + 3, ease.in);
  // The colour of S5 cuts in halfway through the spin.
  const bg = exitP > 0.5 ? S5_BG : bold.bg;

  const layers: React.ReactNode[] = [];
  // The finished work under the current change.
  if (stage > 0) layers.push(<Piece key="base" code={CODES[stage - 1]} bx={0} by={0} bw={S} bh={S} />);
  if (stage === 0) {
    for (let i = 0; i < strips; i++) {
      const p = progress(local, i * 2, t.e(1), ease.out);
      layers.push(<Piece key={`a${i}`} code={CODES[0]} bx={i * sw} by={0} bw={sw + 0.5} bh={S} dy={(1 - p) * (i % 2 ? 1300 : -1300)} />);
    }
  } else if (stage === 1) {
    for (let i = 0; i < strips; i++) {
      const p = progress(local, i * 1.5, t.e(1), ease.inOut);
      if (p <= 0) continue;
      // Each strip unrolls downwards from the top edge (a growing clip).
      layers.push(<Piece key={`b${i}`} code={CODES[1]} bx={i * sw} by={0} bw={sw + 0.5} bh={S} style={{ clipPath: `inset(0 0 ${(1 - p) * 100}% 0)` }} />);
    }
  } else if (stage === 2) {
    for (let i = 0; i < strips; i++) {
      const p = progress(local, i * 1.5, t.e(1), ease.inOut);
      if (p <= 0) continue;
      layers.push(<Piece key={`c${i}`} code={CODES[2]} bx={0} by={i * sw} bw={S} bh={sw + 0.5} dx={(1 - p) * (i % 2 ? S + 300 : -S - 300)} />);
    }
  } else {
    const n = 4;
    const tw = S / n;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const p = progress(local, (r + c) * 2, t.e(1), ease.inOut);
        const deg = 180 * p;
        const front = deg < 90;
        layers.push(
          <div key={`d${r}${c}`} style={{ position: "absolute", left: X0 + c * tw, top: Y0 + r * tw, width: tw + 0.5, height: tw + 0.5, transform: `perspective(1400px) rotateY(${front ? deg : deg - 180}deg)` }}>
            <ArtImage code={front ? CODES[2] : CODES[3]} width={tw + 0.5} height={tw + 0.5} crop={sub(front ? CODES[2] : CODES[3], c * tw, r * tw, tw + 0.5, tw + 0.5)} />
          </div>,
        );
      }
  }

  return (
    <AbsoluteFill style={{ background: bg }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${exitP * 120}deg) scale(${1 - exitP})`, overflow: "hidden" }}>
        {layers}
      </div>
    </AbsoluteFill>
  );
}
