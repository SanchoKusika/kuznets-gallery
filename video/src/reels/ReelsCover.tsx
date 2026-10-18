import { AbsoluteFill } from "remotion";
import { reels } from "../data/selection";
import { LogoBuild, logoGeometry, logoSchedule } from "../effects/LogoBuild";
import { ArtFrame } from "../primitives/ArtFrame";
import { ArtImage } from "../primitives/ArtImage";
import { Nail, PictureWire } from "../primitives/PictureWire";
import { Wall } from "../primitives/Wall";
import { REELS_SAFE } from "../theme/tokens";
import { FRAME_TOP, NAIL } from "./layout";
import { HookText } from "./scenes/R1Hook";

// The cover keeps the act's look but packs hook, frame and logo into the safe zone (x 65–1015, y 270–1250), which
// is also inside the 3:4 profile crop (y 240–1680): the frame hangs a little higher and smaller than in R1–R3.
const HOOK_TOP = 290;
const LOGO_W = 320;
const NAIL_Y = 506;
const FRAME_GAP = 60;

/** Reels cover (brief 7): «Путь домой» hanging still on the nail under the hook, the logo small at the bottom. */
export function ReelsCover() {
  // Logo: its ink sits just above the bottom of the safe zone.
  const probe = logoGeometry(LOGO_W, NAIL.x, 0);
  const logoY = REELS_SAFE.y1 - 16 - probe.ink.y1;
  const ink = logoGeometry(LOGO_W, NAIL.x, logoY).ink;
  const nail = { x: NAIL.x, y: NAIL_Y };
  const top = NAIL_Y + FRAME_TOP - NAIL.y;
  const side = Math.round(ink.y0 - FRAME_GAP - top);
  const frame = { x: nail.x - side / 2, y: top, w: side, h: side };
  const code = reels.interiors[0].code;
  return (
    <AbsoluteFill>
      <Wall windowShadow phase={0} />
      <HookText from={-1000} top={HOOK_TOP} />
      <PictureWire nail={nail} frame={frame} />
      <ArtFrame x={frame.x} y={frame.y} w={frame.w} h={frame.h}>
        <ArtImage code={code} width={frame.w} height={frame.h} />
      </ArtFrame>
      <Nail x={nail.x} y={nail.y} />
      <LogoBuild width={LOGO_W} x={NAIL.x} y={logoY} schedule={logoSchedule.still()} />
    </AbsoluteFill>
  );
}
