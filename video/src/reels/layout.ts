// Shared positions of the Reels (brief 7). Acts read them from here, so the hand-offs between acts line up.

import { logoGeometry } from "../effects/LogoBuild";

/** R1–R3: the nail the frame hangs on; the frame's top edge sits at ≈ y 600. */
export const NAIL = { x: 540, y: 540 };
export const FRAME_TOP = 600;

/** R4: the circle opens from a dot here, ⌀ 440. */
export const CIRCLE = { x: 540, y: 760, d: 440 };

/** R6: the sketch of «Три арки» and the work itself (KZ-009; 780×501 keeps the 1.1× limit after the mock-up trim). */
export const CUSTOM = { w: 780, h: 501, cx: 540, cy: 820 };

/**
 * R7 → R8: the 3D canvas (KZ-009, CUSTOM.w × CUSTOM.h face) as R7 leaves it on its last frame; R8 starts from exactly
 * this. The R6–R7 act owns these values and may change them; R8 must read them, never copy the numbers.
 */
export const CANVAS_HANDOFF = { x: 540, y: 1050, scale: 1.1, rotY: -28, rotX: 0 };

/** R8: the logo (≈ 820 px wide, centre y ≈ 700). */
export const LOGO = { width: 820, x: 540, y: 700 };
export const LOGO_GEOMETRY = logoGeometry(LOGO.width, LOGO.x, LOGO.y);

/** The accent dot R8 collapses into and R1 starts from (diameter, px): the loop's seam. */
export const LOOP_DOT = 28;
