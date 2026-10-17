import { useVideoConfig } from "remotion";
import { nail as nailArt, wirePath } from "../lines/reels";
import { color, stroke } from "../theme/tokens";
import { LinePath } from "./LinePath";

type Pt = { x: number; y: number };

/** Nail on the wall: accent head (the dot of R1 that became a nail), tiny shank and its shadow. */
export function Nail({ x, y, head = 18, shadow = 1 }: { x: number; y: number; head?: number; shadow?: number }) {
  const { width, height } = useVideoConfig();
  const ox = x - nailArt.anchor.x;
  const oy = y - nailArt.anchor.y;
  const [shank, shade] = nailArt.art.parts;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${ox} ${oy})`}>
        <LinePath d={shade} width={stroke.reels} color={color.ink4} opacity={0.75 * shadow} progress={shadow > 0 ? 1 : 0} />
        <LinePath d={shank} width={stroke.reels} />
      </g>
      <circle cx={x} cy={y} r={head / 2} fill={color.accent} />
    </svg>
  );
}

/**
 * Hanging wire from the nail to the frame's top corners (brief 6.3), swung by `angle` with the frame.
 * `progress` draws it on (from the left corner up to the nail and down).
 */
export function PictureWire({ nail, frame, angle = 0, progress = 1 }: { nail: Pt; frame: { x: number; y: number; w: number; h: number }; angle?: number; progress?: number }) {
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <LinePath d={wirePath(nail, frame, angle)} progress={progress} width={stroke.reels * 0.8} color={color.ink2} />
    </svg>
  );
}
