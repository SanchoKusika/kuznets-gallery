import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { CX, CY } from "../layout";

/** The wave across the frame through the three beads (2 periods). */
const wavePath = (amp: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = -60 + (i / 80) * 1200;
    const y = CY - amp * Math.sin(((x - 60) / 960) * Math.PI * 4);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return "M" + pts.join("L");
};

/**
 * S1 (beats 0–2), on ink: the logo's dot pops and beats once; on beat 1 it throws off the three beads, which orbit
 * and line up; the yellow wave draws through them and swells until it is the whole frame (S2's yellow).
 * Frames relative to S1.
 */
export function S1Dot() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTiming();
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
  const pulse = 1 + 0.45 * Math.sin(Math.PI * progress(frame, t.e(1), t.s(1) + 2, ease.linear));
  const splitFrom = t.b(1);
  const orbit = progress(frame, splitFrom, t.e(1), ease.inOut);
  const line = progress(frame, splitFrom + t.e(1) - 2, t.s(1), ease.inOut);
  const dotGone = progress(frame, splitFrom, t.s(1), ease.in);
  const draw = progress(frame, splitFrom + t.e(1), t.s(1) + 2, ease.out);
  const swell = progress(frame, splitFrom + t.e(1) + t.s(1), t.s(1) + 1, ease.in);

  return (
    <AbsoluteFill style={{ background: bold.ink }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {draw > 0 ? (
          <path
            d={wavePath(mix(70, 0, swell))}
            fill="none"
            stroke={bold.yellow}
            strokeWidth={mix(26, 2600, swell)}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${draw} 2`}
          />
        ) : null}
        {dotGone < 1 ? <circle cx={CX} cy={CY} r={44 * pop * pulse * (1 - dotGone)} fill={bold.dot} /> : null}
        {frame >= splitFrom && swell < 0.6
          ? [0, 1, 2].map((i) => {
              const a = -Math.PI / 2 + (i * Math.PI * 2) / 3 + orbit * Math.PI * 2;
              const r = 150 * Math.sin(Math.PI * Math.min(1, orbit * 1.2)) ** 0.6;
              const ox = CX + Math.cos(a) * r;
              const oy = CY + Math.sin(a) * r;
              // Lined up on the wave's troughs/crests: −240, 0, +240.
              const lx = CX + (i - 1) * 240;
              return <circle key={i} cx={mix(ox, lx, line)} cy={mix(oy, CY, line)} r={26 * Math.min(1, orbit * 4)} fill={bold.bg} />;
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
}
