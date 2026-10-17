import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { color, dark } from "../theme/tokens";

type Props = {
  theme?: "light" | "dark";
  /**
   * Reels: a soft window shadow drifting over the wall, 60·sin(2π·f/duration) — the period is the
   * whole video, so the loop is seamless. Uses the composition's absolute frame: mount it at the
   * root of the composition, not inside a scene Sequence.
   */
  windowShadow?: boolean;
  /** Position in the loop, 0…1 — overrides frame/duration (styleframes, stills). */
  phase?: number;
};

/** Paper wall with a very soft large unevenness (≤ 2%) (brief 5.5). */
export function Wall({ theme = "light", windowShadow, phase }: Props) {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const base = theme === "dark" ? dark.paper : color.paper;
  const blot = theme === "dark" ? "rgba(255,255,255,.018)" : "rgba(120,104,84,.02)";
  const light = theme === "dark" ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.12)";
  const drift = 60 * Math.sin(2 * Math.PI * (phase ?? frame / durationInFrames));
  return (
    <AbsoluteFill style={{ backgroundColor: base, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 45% at 22% 18%, ${light}, transparent 70%), radial-gradient(55% 40% at 80% 72%, ${blot}, transparent 70%), radial-gradient(40% 30% at 70% 20%, ${blot}, transparent 70%)`,
        }}
      />
      {windowShadow ? (
        // Blur on the parent, mask on the child: the window bars stay soft too.
        <div
          style={{
            position: "absolute",
            left: width * 0.46 + drift,
            top: -height * 0.05,
            width: width * 0.62,
            height: height * 0.62,
            filter: "blur(80px)",
            opacity: 0.5,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: color.paper2,
              transform: "skewX(-18deg)",
              maskImage:
                "linear-gradient(90deg, #000 0 46%, transparent 46% 54%, #000 54% 100%), linear-gradient(180deg, #000 0 47%, transparent 47% 53%, #000 53%)",
              maskComposite: "intersect",
            }}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
