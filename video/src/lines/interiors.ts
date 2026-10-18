// Reels interiors (brief 6.2, R3): four rooms drawn in line under the hanging canvas. Box 1080 × 460 placed at
// (0, 1240), floor at box y 426 (the floor itself is the thread — drawn by the scene, shared by all rooms).
//
// Each room is a list of elements; the scene draws them in a sweep from left to right, many at once, and erases
// them the same way on a change. Some elements live after they are drawn (`motion`): plants sway, lamps swing,
// steam rises, a clock ticks — as functions of the beat, so the loop and 50 fps stay exact.
//
// The canvas hangs above (frames, screen px): home and cafe 620² (to y 1220), office 820 × 482 (to y 1082), kids
// 420 × 830 (x 330–750 down to y 1430 → box y ≤ 190 there is behind the canvas).

export const INTERIOR = { x: 0, y: 1240, w: 1080, h: 460, floor: 426 } as const;

export type Motion = {
  /** Degrees about `pivot`. */
  rotate?: number;
  pivot?: readonly [number, number];
  dx?: number;
  dy?: number;
  /** Dashes running along the path (steam, light). */
  dash?: { array: string; offset: number };
  opacity?: number;
};

export type Element = {
  d: string;
  /** Idle life once drawn, from the beat count since the act's start. */
  motion?: (beat: number) => Motion;
  /** A finer, lighter stroke (patterns, steam, light rays). */
  fine?: boolean;
};

export type Room = { key: "home" | "kids" | "office" | "cafe"; elements: Element[] };

const F = INTERIOR.floor;
const n = (v: number) => +v.toFixed(1);

// Circles and ellipses as cubic Béziers (path lengths then use plain arithmetic, the same in Node and the browser).
const K = 0.5523;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)} ${n(cy)}C${n(cx - rx)} ${n(cy - ry * K)} ${n(cx - rx * K)} ${n(cy - ry)} ${n(cx)} ${n(cy - ry)}` +
  `C${n(cx + rx * K)} ${n(cy - ry)} ${n(cx + rx)} ${n(cy - ry * K)} ${n(cx + rx)} ${n(cy)}` +
  `C${n(cx + rx)} ${n(cy + ry * K)} ${n(cx + rx * K)} ${n(cy + ry)} ${n(cx)} ${n(cy + ry)}` +
  `C${n(cx - rx * K)} ${n(cy + ry)} ${n(cx - rx)} ${n(cy + ry * K)} ${n(cx - rx)} ${n(cy)}`;
const circle = (cx: number, cy: number, r: number) => ellipse(cx, cy, r, r);

/** Rounded rect, clockwise from the top-left corner. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}` +
  `H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}`;

/** Throw cushion: a square with softly pinched sides and a seam tuft. */
const cushion = (cx: number, cy: number, s: number, tilt = 0) => {
  const a = s / 2;
  const p = s * 0.13;
  const t = tilt;
  return (
    `M${cx - a} ${cy - a + t}Q${cx} ${cy - a + p} ${cx + a} ${cy - a - t}Q${cx + a - p} ${cy} ${cx + a} ${cy + a - t}` +
    `Q${cx} ${cy + a - p} ${cx - a} ${cy + a + t}Q${cx - a + p} ${cy} ${cx - a} ${cy - a + t}`
  );
};

/** A leaf from its base, pointing at `angle` (deg, 0 = up), length l, half-width w. */
const leaf = (x: number, y: number, angle: number, l: number, w: number) => {
  const a = (angle * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const tip = [x + ux * l, y + uy * l];
  const side = (s: number) => [x + ux * l * 0.5 + uy * -w * s, y + uy * l * 0.5 + ux * w * s];
  const [l1, r1] = [side(1), side(-1)];
  return `M${n(x)} ${n(y)}Q${n(l1[0])} ${n(l1[1])} ${n(tip[0])} ${n(tip[1])}Q${n(r1[0])} ${n(r1[1])} ${n(x)} ${n(y)}` + `M${n(x)} ${n(y)}L${n(x + ux * l * 0.8)} ${n(y + uy * l * 0.8)}`;
};

/** A soft periodic sway (deg) with its own period and phase, in beats. */
const sway = (deg: number, period: number, phase = 0) => (b: number) => deg * Math.sin((2 * Math.PI * (b + phase)) / period);

/** Steam: dashes rising along a wisp. */
const steam = (speed = 24) => (b: number): Motion => ({ dash: { array: "16 12", offset: b * speed }, opacity: 0.9 });

/* ── Home: sofa with cushions and a throw, arc lamp, side table with a monstera, big plant, rug, cat ─────── */

const home: Room = {
  key: "home",
  elements: [
    // Side table with the monstera on it.
    { d: `${ellipse(170, 332, 46, 9)}M170 341V420M144 422H196` },
    {
      d: `M152 300H188L183 330H157L152 300` + leaf(170, 300, -38, 58, 18) + leaf(170, 300, 8, 72, 20) + leaf(170, 300, 48, 54, 16),
      motion: (b) => ({ rotate: sway(2.5, 3)(b), pivot: [170, 300] }),
    },
    // Sofa: arms, back, seat cushions, front, legs; pillows; a throw over the right arm.
    {
      d:
        rr(236, 262, 56, 132, 26) +
        rr(648, 262, 56, 132, 26) +
        `M292 300V214Q292 196 312 196H628Q648 196 648 214V300` +
        `M470 200V292` +
        rr(292, 292, 178, 44, 12) +
        rr(470, 292, 178, 44, 12) +
        `M292 336V394H648V336` +
        `M276 394L270 420M664 394L670 420`,
    },
    { d: cushion(340, 262, 62, 4) + cushion(598, 260, 58, -3) },
    { d: `M652 270Q680 254 706 272L712 352Q694 366 674 352L670 306` + `M684 286L690 344`, fine: true },
    // Arc lamp: base, the arc over the sofa, the dome, the bulb and its light.
    {
      d: `${ellipse(880, 421, 40, 7)}M880 414V176Q880 52 752 52Q676 52 640 92` + `M604 138C604 110 622 94 640 94C658 94 676 110 676 138H604` + circle(640, 146, 6),
      motion: (b) => ({ rotate: sway(1.2, 4, 0.5)(b), pivot: [880, 414] }),
    },
    { d: `M612 160L596 186M640 164V194M668 160L684 186`, fine: true, motion: (b) => ({ opacity: 0.55 + 0.45 * Math.sin(Math.PI * b) ** 2, rotate: sway(1.2, 4, 0.5)(b), pivot: [880, 414] }) },
    // Big plant in a basket, right.
    {
      d: rr(964, 356, 72, 66, 10) + `M968 378H1032M968 400H1032` + leaf(1000, 356, -26, 120, 22) + leaf(1000, 356, 4, 150, 20) + leaf(1000, 356, 34, 108, 22) + leaf(1000, 356, -60, 70, 16),
      motion: (b) => ({ rotate: sway(2, 2.5, 1)(b), pivot: [1000, 356] }),
    },
    // Rug with fringes.
    { d: ellipse(470, 428, 300, 16) + `M164 422L150 418M164 432L150 436M776 422L790 418M776 432L790 436`, fine: true },
    // A cat sitting on the rug, eyes shut, its tail flicking.
    {
      d:
        `M762 422Q734 422 736 390Q738 364 756 356L750 330L766 344Q776 340 786 344L802 330L796 356Q814 366 814 390Q814 422 788 422H762` +
        `M760 362Q764 366 768 362M782 362Q786 366 790 362M772 372L775 375L778 372`,
    },
    { d: `M812 412Q840 414 842 392Q843 378 832 376`, motion: (b) => ({ rotate: 10 * Math.max(0, Math.sin(Math.PI * b * 0.75)) ** 6, pivot: [812, 412] }) },
  ],
};

/* ── Kids: bed with a teddy, rocket, shelf with books and blocks, bunting, ball, rug ──────────────────────── */

const flags = (x0: number, y0: number, x1: number, y1: number, sag: number, count: number) => {
  let d = `M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag * 2} ${x1} ${y1}`;
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * u;
    const y = y0 + (y1 - y0) * u + sag * 4 * u * (1 - u);
    d += `M${n(x - 16)} ${n(y)}L${n(x)} ${n(y + 30)}L${n(x + 16)} ${n(y)}`;
  }
  return d;
};

const kids: Room = {
  key: "kids",
  elements: [
    // Bunting either side of the canvas.
    { d: flags(20, 40, 300, 70, 20, 5), motion: (b) => ({ rotate: sway(1.5, 3)(b), pivot: [20, 40] }) },
    { d: flags(780, 70, 1060, 40, 20, 5), motion: (b) => ({ rotate: sway(1.5, 3, 1.5)(b), pivot: [1060, 40] }) },
    // Bed: headboard, mattress, blanket with its fold, footboard, legs; pillow; teddy.
    {
      d:
        `M64 426V252Q64 222 94 222Q124 222 124 252V426` +
        rr(124, 324, 252, 36, 10) +
        `M124 360H376` +
        `M200 324Q262 316 376 326V360H196Q190 340 200 324` +
        `M376 426V318Q376 298 396 298Q416 298 416 318V426` +
        `M150 360V426M352 360V426`,
    },
    { d: cushion(158, 308, 44, 2) },
    { d: circle(310, 286, 18) + circle(296, 270, 7) + circle(324, 270, 7) + `M292 318Q290 302 310 302Q330 302 328 318Q326 326 310 326Q294 326 292 318` + circle(310, 290, 2.5) },
    // Rocket: body, window, fins, stripes, flame.
    {
      d:
        `M560 396V300Q560 254 594 222Q628 254 628 300V396H560` +
        circle(594, 296, 14) +
        circle(594, 296, 7) +
        `M560 344L534 384V414L560 396M628 344L654 384V414L628 396` +
        `M560 366H628M572 396V408H616V396`,
    },
    { d: `M582 412Q594 444 606 412`, motion: (b) => ({ opacity: 0.6 + 0.4 * Math.abs(Math.sin(Math.PI * 4 * b)), dy: 2 * Math.sin(Math.PI * 4 * b) }) },
    // Ball on the rug, a small bounce.
    { d: circle(476, 404, 20) + `M458 396Q476 408 494 396M476 384V424`, motion: (b) => ({ dy: -10 * Math.abs(Math.sin(Math.PI * b)) }) },
    // Shelf: board, brackets, books, a pot, blocks.
    {
      d:
        `M790 196H1030M816 196V218L840 196M1004 196V218L980 196` +
        `M806 196V128H826V196M830 196V142H848V196M852 196L866 134L884 138L870 196` +
        rr(920, 162, 34, 34, 4) +
        `M928 162L937 140L946 162` +
        rr(966, 166, 30, 30, 3) +
        `M974 174H988M981 174V190`,
    },
    // Blocks on the floor.
    { d: rr(770, 382, 44, 44, 4) + rr(820, 382, 44, 44, 4) + rr(795, 338, 44, 44, 4) + `M782 414L792 392L802 414M786 406H798` + `M833 392H849M833 392V414H843Q851 414 851 408Q851 402 843 402H833` + circle(817, 360, 10) },
    // Round rug.
    { d: ellipse(560, 432, 240, 12) + ellipse(560, 432, 200, 8), fine: true },
  ],
};

/* ── Office: desk with a laptop, mug, papers and a lamp, swivel chair, tall plant, wall clock ───────────── */

const office: Room = {
  key: "office",
  elements: [
    // Wall clock: rim, ticks, hands (the minute hand turns).
    { d: circle(150, 92, 40) + `M150 56V62M150 122V128M114 92H120M180 92H186` },
    { d: `M150 92L150 68`, motion: (b) => ({ rotate: b * 30, pivot: [150, 92] }) },
    { d: `M150 92L166 98`, motion: (b) => ({ rotate: b * 2.5, pivot: [150, 92] }) },
    // Tall plant in a pot, left.
    {
      d: `M64 342H124L116 424H72L64 342M60 342H128` + leaf(94, 342, -20, 110, 14) + leaf(94, 342, 10, 140, 12) + leaf(94, 342, 32, 96, 14) + leaf(94, 342, -44, 70, 12),
      motion: (b) => ({ rotate: sway(1.8, 3, 0.7)(b), pivot: [94, 342] }),
    },
    // Desk: top, leg, drawer unit with drawers and handles.
    { d: rr(236, 226, 540, 18, 4) + `M262 244V424M612 244V420H752V244M612 306H752M612 364H752M666 274H698M666 334H698M666 392H698` },
    // Laptop: screen, keyboard deck, and lines being typed.
    { d: `M332 222L352 132H488L470 222` + `M314 224H500` + `M354 224L360 214H458L464 224` },
    {
      d: `M372 154H428M370 170H452M368 186H414M366 202H440`,
      fine: true,
      motion: (b) => ({ dash: { array: `${(40 + 120 * ((b * 0.5) % 1)).toFixed(1)} 400`, offset: 0 } }),
    },
    // Papers, mug with steam.
    { d: `M252 222L258 196H320L316 222M262 206H310` , fine: true },
    { d: `M524 222V184H560V214Q560 222 552 222H532Q524 222 524 214M560 192Q576 192 576 204Q576 214 560 214` },
    { d: `M534 172Q526 158 536 146Q546 134 538 120M552 172Q544 160 552 148Q560 136 554 124`, fine: true, motion: steam() },
    // Desk lamp: base, two arms, joint, shade, light.
    {
      d: `M684 226Q684 212 700 212H732Q748 212 748 226` + `M716 212L688 150L736 104` + circle(688, 150, 6) + `M728 96L744 84L792 122Q776 146 746 150L728 96`,
      motion: (b) => ({ rotate: sway(1, 4)(b), pivot: [716, 212] }),
    },
    // Swivel chair: back, seat, column, star base, casters (turns a little).
    {
      d: rr(860, 196, 120, 96, 26) + `M920 292V312` + rr(846, 312, 148, 18, 9) + `M920 330V384M864 404L920 384L976 404M920 384V404` + circle(864, 414, 7) + circle(976, 414, 7) + circle(920, 412, 7),
      motion: (b) => ({ rotate: sway(2, 4, 1)(b), pivot: [920, 410] }),
    },
    { d: ellipse(920, 428, 110, 9), fine: true },
  ],
};

/* ── Cafe: two pendant lamps, bistro table with cups, croissant and steam, two chairs, menu board, plant ──── */

const pendant = (x: number) => `M${x} -20V70` + `M${x - 46} 122Q${x - 44} 76 ${x} 74Q${x + 44} 76 ${x + 46} 122H${x - 46}` + circle(x, 128, 6);

const cafe: Room = {
  key: "cafe",
  elements: [
    { d: pendant(330), motion: (b) => ({ rotate: sway(2.2, 3)(b), pivot: [330, -20] }) },
    { d: pendant(750), motion: (b) => ({ rotate: sway(2.2, 3, 1.5)(b), pivot: [750, -20] }) },
    { d: `M302 150L290 172M330 154V178M358 150L370 172`, fine: true, motion: (b) => ({ rotate: sway(2.2, 3)(b), pivot: [330, -20], opacity: 0.55 + 0.45 * Math.sin(Math.PI * b) ** 2 }) },
    { d: `M722 150L710 172M750 154V178M778 150L790 172`, fine: true, motion: (b) => ({ rotate: sway(2.2, 3, 1.5)(b), pivot: [750, -20], opacity: 0.55 + 0.45 * Math.cos(Math.PI * b) ** 2 }) },
    // Menu board on its easel, left.
    { d: `M74 426L104 244H196L226 426M96 290H204M150 244V230` + rr(92, 254, 116, 92, 4) + `M106 276H170M106 296H188M106 316H156`, fine: false },
    // Bistro table: top, apron, pedestal, foot.
    { d: ellipse(540, 238, 170, 14) + `M378 244Q540 268 702 244` + `M540 260V404M486 424Q540 398 594 424` },
    // Chairs either side, facing the table.
    { d: `M300 426L306 308M306 300Q296 246 298 196Q300 180 316 186M300 232Q312 226 314 214M288 300H386M290 308H384M378 308L390 426M302 382Q342 374 384 382` },
    { d: `M780 426L774 308M774 300Q784 246 782 196Q780 180 764 186M780 232Q768 226 766 214M792 300H694M790 308H696M702 308L690 426M778 382Q738 374 696 382` },
    // On the table: two cups on saucers, a croissant on a plate.
    { d: `M452 196H496V214Q496 228 482 228H466Q452 228 452 214V196M496 202Q510 202 510 212Q510 220 496 220M440 230H508` },
    { d: `M590 192H630V214Q630 228 616 228H604Q590 228 590 214V192M590 198Q576 198 576 208Q576 218 590 218M580 230H642` },
    { d: ellipse(540, 228, 34, 6) + `M514 222Q520 200 540 198Q560 200 566 222M526 206L532 222M554 206L548 222`, fine: false },
    { d: `M466 186Q456 170 468 156Q480 142 470 126M482 186Q474 172 484 160Q494 148 486 134`, fine: true, motion: steam() },
    { d: `M604 182Q594 166 606 152Q618 138 608 122M620 182Q612 168 622 156Q632 144 624 130`, fine: true, motion: steam(28) },
    // Plant, right.
    {
      d: `M950 352H1022L1012 424H960L950 352` + leaf(986, 352, -30, 84, 20) + leaf(986, 352, 0, 104, 18) + leaf(986, 352, 32, 80, 20),
      motion: (b) => ({ rotate: sway(2, 2.5, 0.4)(b), pivot: [986, 352] }),
    },
  ],
};

/** Rooms in Reels order (R3). */
export const REELS_ROOMS: readonly Room[] = [home, kids, office, cafe];

/** The floor: a thread entering from the left edge as a wave and straightening (flat = 1) into the floor line. */
export function floorPath(flat: number, width = INTERIOR.w) {
  let d = "";
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = -20 + (width + 40) * u;
    const env = (1 - flat) * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u) ** 1.2;
    const y = F + 60 * env * Math.sin(2 * Math.PI * 2.2 * u) - 120 * (1 - flat) * (1 - u) ** 3;
    d += `${i ? "L" : "M"}${n(x)} ${n(y)}`;
  }
  return d;
}

/** Leftmost x of a path (the sweep order). */
export function leftOf(d: string) {
  const xs = [...d.matchAll(/[ML]\s*(-?[\d.]+)/g)].map((m) => Number(m[1]));
  return xs.length ? Math.min(...xs) : 0;
}
