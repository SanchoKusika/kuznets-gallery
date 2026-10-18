import { useCurrentFrame } from "remotion";
import { FLOOR_Y } from "../../lines/gallery";
import { useTiming } from "../../theme/timing";
import { color, dark, stroke } from "../../theme/tokens";
import { cameraX, hallX, worldZoom } from "../layout";

/** Board pitch along the wall, world px; the floor ends with the last hall (P4's whip carries its end away). */
const BOARD = 150;
const FLOOR_FROM = -200;
const FLOOR_TO = hallX(4);
/** The eye line (the works' centres): the boards run to a vanishing point on it. */
const EYE_Y = 450;

/**
 * The gallery floor under the long wall of P1–P4, in screen space: a plane a shade darker than the wall, boards
 * running from the wall towards the viewer and converging on the eye line, two seams along the wall. As the camera
 * moves the boards turn — the floor reads as a floor, not as a line. Light, or the dark of P1 (`opacity` fades it in).
 */
export function FloorPlane({ theme = "light", opacity = 1 }: { theme?: "light" | "dark"; opacity?: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const cam = cameraX(frame, t);
  const z = worldZoom(frame, t);
  const sx = (wx: number) => (wx - cam - 960) * z + 960;
  const j = (FLOOR_Y - 540) * z + 540;
  const vp = (EYE_Y - 540) * z + 540;
  const toBottom = (x: number, y = 1080) => 960 + ((x - 960) * (y - vp)) / (j - vp);
  const x0 = sx(FLOOR_FROM);
  const x1 = sx(FLOOR_TO);
  if (x1 < -400 || x0 > 2320) return null;

  const ink = theme === "dark" ? dark.line : color.ink;
  const boardColor = theme === "dark" ? dark.line : color.ink4;
  const [top, bottom] = theme === "dark" ? ["#1C1B19", "#232220"] : [color.paper2, color.paper3];

  const boards: string[] = [];
  const first = Math.ceil((cam - 400 - FLOOR_FROM) / BOARD) * BOARD + FLOOR_FROM;
  for (let wx = Math.max(FLOOR_FROM, first); wx <= Math.min(FLOOR_TO, cam + 2400); wx += BOARD) {
    const x = sx(wx);
    boards.push(`M${x.toFixed(1)} ${j.toFixed(1)}L${toBottom(x).toFixed(1)} 1080`);
  }
  const seam = (y: number) => `M${Math.max(-10, toBottom(x0, y)).toFixed(1)} ${y}L${Math.min(1930, toBottom(x1, y)).toFixed(1)} ${y}`;
  const id = `floor-${theme}`;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <linearGradient id={id} x1="0" y1={j} x2="0" y2="1080" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <path d={`M${x0} ${j}L${x1} ${j}L${toBottom(x1)} 1080L${toBottom(x0)} 1080Z`} fill={`url(#${id})`} />
      <path d={boards.join("")} stroke={boardColor} strokeWidth={1.2} opacity={theme === "dark" ? 0.18 : 0.55} fill="none" />
      <path d={seam(j + 34) + seam(j + 84)} stroke={boardColor} strokeWidth={1} opacity={theme === "dark" ? 0.12 : 0.35} fill="none" />
      <path d={`M${x0} ${j}L${x1} ${j}`} stroke={ink} strokeWidth={stroke.promo} opacity={theme === "dark" ? 0.35 : 1} />
    </svg>
  );
}
