import { AbsoluteFill } from "remotion";
import { REELS_SAFE } from "../theme/tokens";

/**
 * Meta Reels overlay guide (brief 5.7): covered areas (14% top, 35% bottom, 6% sides, the icon
 * column on the right) tinted, and the text/logo box framed. Shown only with `showGuides`.
 */
export function SafeZone() {
  const W = 1080;
  const H = 1920;
  const veil = "rgba(224,40,40,.18)";
  const top = Math.round(H * 0.14);
  const bottom = Math.round(H * 0.35);
  const side = Math.round(W * 0.06);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: top, background: veil }} />
      <div style={{ position: "absolute", left: 0, top: H - bottom, width: W, height: bottom, background: veil }} />
      <div style={{ position: "absolute", left: 0, top, width: side, height: H - top - bottom, background: veil }} />
      <div style={{ position: "absolute", right: 0, top, width: side, height: H - top - bottom, background: veil }} />
      {/* Like / comment / share column. */}
      <div style={{ position: "absolute", right: side, top: H - bottom - 560, width: 96, height: 560, background: veil }} />
      <div
        style={{
          position: "absolute",
          left: REELS_SAFE.x0,
          top: REELS_SAFE.y0,
          width: REELS_SAFE.x1 - REELS_SAFE.x0,
          height: REELS_SAFE.y1 - REELS_SAFE.y0,
          outline: "3px dashed rgba(224,40,40,.9)",
        }}
      />
    </AbsoluteFill>
  );
}
