// Promo halls (brief 8, P3): four rooms in line under the works, in the style of the Reels interiors — many details,
// drawn in a sweep, living after. Box 1920 × 300 at the hall's (0, 700) in world px; the floor (box y 262) is the
// wall's own line (ActWorld), so the rooms stand on it and do not draw it. Above the box: works on the eye line and
// their museum labels (down to screen y ≈ 640), so nothing rises above box y 0.

import { circle, cushion, ellipse, leaf, rr, steam, sway, type Element } from "./shapes";

export const PROMO_ROOM = { w: 1920, h: 300, y: 700, floor: 262 } as const;

const F = PROMO_ROOM.floor;

/** Bunting: a sagging cord with triangle flags. */
const flags = (x0: number, y0: number, x1: number, y1: number, sag: number, count: number) => {
  let d = `M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag * 2} ${x1} ${y1}`;
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * u;
    const y = y0 + (y1 - y0) * u + sag * 4 * u * (1 - u);
    d += `M${(x - 14).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y + 26).toFixed(1)}L${(x + 14).toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
};

/** Pot standing on the floor: rim, tapered body. */
const pot = (cx: number, top: number, w: number) => `M${cx - w / 2 - 6} ${top}H${cx + w / 2 + 6}M${cx - w / 2} ${top}L${cx - w / 2 + 10} ${F}H${cx + w / 2 - 10}L${cx + w / 2} ${top}`;

/**
 * Bistro chair in profile (the Reels cafe chair), seat front-left corner at (x, seatY), scaled so the legs reach the
 * floor; `dir` 1 faces right (back post on the left), −1 faces left.
 */
const chair = (x: number, seatY: number, dir: 1 | -1) => {
  const k = (F - seatY) / 126;
  const P = (dx: number, dy: number) => `${(x + dir * dx * k).toFixed(1)} ${(seatY + dy * k).toFixed(1)}`;
  return (
    `M${P(12, 126)}L${P(18, 8)}M${P(18, 0)}Q${P(8, -54)} ${P(10, -104)}Q${P(12, -120)} ${P(28, -114)}M${P(12, -68)}Q${P(24, -74)} ${P(26, -86)}` +
    `M${P(0, 0)}L${P(98, 0)}M${P(2, 8)}L${P(96, 8)}M${P(90, 8)}L${P(102, 126)}M${P(14, 82)}Q${P(54, 74)} ${P(96, 82)}`
  );
};

/** Pendant lamp from above the box: cord, dome, bulb. */
const pendant = (x: number, drop: number) => `M${x} -30V${drop}` + `M${x - 40} ${drop + 44}Q${x - 38} ${drop + 2} ${x} ${drop}Q${x + 38} ${drop + 2} ${x + 40} ${drop + 44}H${x - 40}` + circle(x, drop + 50, 5);

const rays = (x: number, y: number) => `M${x - 24} ${y}L${x - 36} ${y + 20}M${x} ${y + 4}V${y + 26}M${x + 24} ${y}L${x + 36} ${y + 20}`;

/** Steaming cup on a saucer, handle right; cup bottom at y. */
const cup = (x: number, y: number) => `M${x} ${y - 30}H${x + 40}V${y - 12}Q${x + 40} ${y} ${x + 28} ${y}H${x + 12}Q${x} ${y} ${x} ${y - 12}V${y - 30}M${x + 40} ${y - 24}Q${x + 52} ${y - 24} ${x + 52} ${y - 16}Q${x + 52} ${y - 8} ${x + 40} ${y - 8}M${x - 12} ${y + 2}H${x + 56}`;
const wisps = (x: number, y: number) => `M${x + 12} ${y}Q${x + 4} ${y - 14} ${x + 14} ${y - 26}Q${x + 24} ${y - 38} ${x + 16} ${y - 52}M${x + 28} ${y}Q${x + 20} ${y - 12} ${x + 30} ${y - 24}Q${x + 40} ${y - 36} ${x + 32} ${y - 48}`;

/* ── «для дома» ──────────────────────────────────────────────────────────────────────────────────────────── */

const home: Element[] = [
  // Sideboard with a vase of branches and a stack of books.
  { d: rr(70, 160, 260, 88, 6) + `M90 248L86 ${F}M310 248L314 ${F}M200 168V240` + circle(188, 204, 3) + circle(212, 204, 3) },
  { d: `M110 160Q100 140 112 124V112H128V124Q140 140 130 160M120 112Q112 80 96 64M120 112Q128 82 148 70M120 112V56`, motion: (b) => ({ rotate: sway(1.5, 3)(b), pivot: [120, 160] }) },
  { d: `M236 160V146H312V160M244 146V132H304V146M252 132V120H296V132` },
  // Arc lamp over the sofa, its light breathing.
  {
    d: ellipse(470, 256, 34, 6) + `M470 250V100Q470 14 580 12Q664 12 712 58` + `M676 100C676 76 692 62 712 62C732 62 748 76 748 100H676` + circle(712, 106, 5),
    motion: (b) => ({ rotate: sway(1, 4)(b), pivot: [470, 250] }),
  },
  { d: rays(712, 122), fine: true, motion: (b) => ({ rotate: sway(1, 4)(b), pivot: [470, 250], opacity: 0.55 + 0.45 * Math.sin(Math.PI * b) ** 2 }) },
  // Three-seat sofa: arms, back, seat cushions, front, legs; pillows; a throw over the right arm.
  {
    d:
      rr(760, 110, 60, 140, 28) +
      rr(1240, 110, 60, 140, 28) +
      `M820 156V62Q820 44 840 44H1220Q1240 44 1240 62V156M960 50V150M1100 50V150` +
      rr(820, 150, 140, 44, 12) +
      rr(960, 150, 140, 44, 12) +
      rr(1100, 150, 140, 44, 12) +
      `M820 194V250H1240V194M780 250L776 ${F}M1280 250L1284 ${F}`,
  },
  { d: cushion(870, 122, 56, 4) + cushion(1030, 124, 50, 2) + cushion(1192, 120, 52, -3), fill: true },
  { d: `M1244 116Q1272 100 1298 118L1304 196Q1286 210 1266 196L1262 150Q1252 128 1244 116`, fill: true },
  { d: `M1278 130L1284 190`, fine: true },
  // Rug with fringes.
  { d: ellipse(1030, 278, 330, 12) + `M700 274L686 271M700 282L686 285M1360 274L1374 271M1360 282L1374 285`, fine: true, fill: true },
  // Side table with a monstera.
  { d: ellipse(1400, 190, 42, 8) + `M1400 198V258M1376 260H1424` },
  {
    d: `M1382 158H1418L1413 188H1387L1382 158` + leaf(1400, 158, -40, 60, 18) + leaf(1400, 158, 6, 76, 20) + leaf(1400, 158, 46, 56, 16),
    motion: (b) => ({ rotate: sway(2.5, 3, 0.5)(b), pivot: [1400, 158] }),
  },
  // A cat sitting by the table, eyes shut, its tail flicking.
  {
    d:
      `M1512 ${F - 2}Q1484 ${F - 2} 1486 230Q1488 204 1506 196L1500 170L1516 184Q1526 180 1536 184L1552 170L1546 196Q1564 206 1564 230Q1564 ${F - 2} 1538 ${F - 2}H1512` +
      `M1510 202Q1514 206 1518 202M1532 202Q1536 206 1540 202M1522 212L1525 215L1528 212`,
  },
  { d: `M1562 252Q1590 254 1592 232Q1593 218 1582 216`, motion: (b) => ({ rotate: 10 * Math.max(0, Math.sin(Math.PI * b * 0.75)) ** 6, pivot: [1562, 252] }) },
  // Big plant in a basket.
  {
    d: rr(1690, 190, 84, 72, 10) + `M1694 212H1770M1694 236H1770` + leaf(1732, 190, -28, 130, 22) + leaf(1732, 190, 2, 168, 20) + leaf(1732, 190, 32, 120, 22) + leaf(1732, 190, -62, 76, 16),
    motion: (b) => ({ rotate: sway(2, 2.5, 1)(b), pivot: [1732, 190] }),
  },
];

/* ── «для детской» ───────────────────────────────────────────────────────────────────────────────────────── */

const kids: Element[] = [
  // Teepee with a flag.
  { d: `M100 ${F}L210 44L320 ${F}M210 44L196 20M210 44L224 20M210 150Q182 204 162 ${F}M210 150Q238 204 258 ${F}M210 150V${F}` },
  { d: `M224 20V0L246 8L224 14`, motion: (b) => ({ rotate: sway(6, 1.5)(b), pivot: [224, 20] }) },
  // Bunting along the top.
  { d: flags(380, 16, 1540, 26, 18, 16), motion: (b) => ({ rotate: sway(0.6, 3)(b), pivot: [960, 16] }) },
  // Bed with a pillow, a blanket and a teddy.
  {
    d:
      `M600 ${F}V100Q600 72 628 72Q656 72 656 100V${F}` +
      rr(656, 170, 400, 36, 10) +
      `M656 206H1056M760 170Q900 160 1056 172V206H756Q750 186 760 170` +
      `M1056 ${F}V140Q1056 120 1076 120Q1096 120 1096 140V${F}M690 206V${F}M1020 206V${F}`,
  },
  { d: cushion(706, 152, 50, 2), fill: true },
  { d: circle(980, 130, 18) + circle(966, 114, 7) + circle(994, 114, 7) + `M962 162Q960 146 980 146Q1000 146 998 162Q996 170 980 170Q964 170 962 162` + circle(980, 134, 2.5) },
  { d: ellipse(850, 278, 300, 12) + ellipse(850, 278, 250, 7), fine: true, fill: true },
  // Rocket with its flame.
  {
    d:
      `M1200 236V140Q1200 96 1232 64Q1264 96 1264 140V236H1200` +
      circle(1232, 136, 14) +
      circle(1232, 136, 7) +
      `M1200 186L1176 226V254L1200 236M1264 186L1288 226V254L1264 236M1200 208H1264M1212 236V248H1252V236`,
  },
  { d: `M1220 252Q1232 282 1244 252`, motion: (b) => ({ opacity: 0.6 + 0.4 * Math.abs(Math.sin(Math.PI * 4 * b)), dy: 2 * Math.sin(Math.PI * 4 * b) }) },
  // Ball, bouncing a little.
  { d: circle(1120, 242, 20) + `M1102 234Q1120 246 1138 234M1120 222V262`, motion: (b) => ({ dy: -12 * Math.abs(Math.sin(Math.PI * b)) }) },
  // Blocks.
  { d: rr(1340, 218, 44, 44, 4) + rr(1390, 218, 44, 44, 4) + rr(1365, 174, 44, 44, 4) + `M1352 250L1362 228L1372 250M1356 242H1368` + `M1403 228H1419M1403 228V250H1413Q1421 250 1421 244Q1421 238 1413 238H1403` + circle(1387, 196, 10) },
  // Low bookcase with books and a mushroom lamp.
  { d: rr(1560, 120, 260, 142, 6) + `M1560 190H1820M1580 190V138M1600 190V146M1620 190L1634 140L1650 144L1636 190M1700 262V206M1724 262V214M1748 262V204` },
  { d: `M1744 120V96M1716 96Q1716 66 1744 66Q1772 66 1772 96H1716` },
  { d: rays(1744, 104), fine: true, motion: (b) => ({ opacity: 0.5 + 0.5 * Math.sin(Math.PI * b * 0.5) ** 2 }) },
];

/* ── «для офиса» ─────────────────────────────────────────────────────────────────────────────────────────── */

const office: Element[] = [
  // Tall plant, left.
  {
    d: pot(140, 180, 66) + leaf(140, 180, -22, 120, 14) + leaf(140, 180, 8, 160, 12) + leaf(140, 180, 30, 110, 14) + leaf(140, 180, -46, 80, 12),
    motion: (b) => ({ rotate: sway(1.8, 3, 0.7)(b), pivot: [140, 180] }),
  },
  // Bookshelf: frame, shelves, books, a box, a small plant.
  {
    d:
      rr(260, 40, 270, 222, 4) +
      `M260 114H530M260 188H530` +
      `M276 114V60M292 114V66M308 114V56M324 114L340 64L354 68L338 114` +
      `M380 188V140M396 188V132M412 188V144` +
      rr(450, 140, 60, 48, 3) +
      `M276 262V212M292 262V206M308 262V214`,
  },
  { d: `M466 114H498L494 92H470L466 114` + leaf(482, 92, -30, 30, 9) + leaf(482, 92, 20, 34, 9), motion: (b) => ({ rotate: sway(3, 2.5)(b), pivot: [482, 92] }) },
  // Desk with a drawer unit.
  { d: rr(640, 120, 540, 16, 4) + `M666 136V${F}M1154 136V${F}M1010 136V250H1150V136M1010 174H1150M1010 212H1150M1066 156H1094M1066 194H1094M1066 232H1094` },
  // Monitor, stand, keyboard; lines being typed on the screen.
  { d: rr(770, 0, 200, 102, 8) + `M870 102V114M846 116H894` + rr(790, 106, 150, 8, 3) },
  { d: `M792 22H860M792 40H900M792 58H836M792 76H884`, fine: true, motion: (b) => ({ dash: { array: `${(30 + 90 * ((b * 0.5) % 1)).toFixed(1)} 300`, offset: 0 } }) },
  // Mug with steam, a pen pot.
  { d: `M984 116V84H1016V110Q1016 116 1010 116H990Q984 116 984 110M1016 92Q1030 92 1030 102Q1030 110 1016 110` },
  { d: wisps(984, 76), fine: true, motion: steam() },
  { d: `M680 116V92H704V116M686 92L680 70M692 92V66M698 92L708 72` },
  // Desk lamp.
  {
    d: `M1110 120Q1110 108 1124 108H1150Q1164 108 1164 120M1137 108L1112 52L1154 14` + circle(1112, 52, 5) + `M1146 6L1162 -4L1204 28Q1192 48 1166 50L1146 6`,
    motion: (b) => ({ rotate: sway(1, 4)(b), pivot: [1137, 108] }),
  },
  // Swivel chair, turning a little.
  {
    d: rr(1250, 40, 116, 96, 26) + `M1308 136V156` + rr(1236, 156, 144, 18, 9) + `M1308 174V226M1254 246L1308 226L1362 246M1308 226V246` + circle(1254, 254, 6) + circle(1362, 254, 6) + circle(1308, 254, 6),
    motion: (b) => ({ rotate: sway(2, 4, 1)(b), pivot: [1308, 254] }),
  },
  // Filing cabinet with a printer.
  { d: rr(1500, 120, 150, 142, 4) + `M1500 168H1650M1500 216H1650M1560 144H1590M1560 192H1590M1560 240H1590` + rr(1510, 86, 130, 34, 6) + `M1530 86V72H1620V86` },
  // Big plant, right.
  {
    d: pot(1790, 170, 80) + leaf(1790, 170, -30, 110, 22) + leaf(1790, 170, 4, 150, 20) + leaf(1790, 170, 34, 104, 22),
    motion: (b) => ({ rotate: sway(2, 2.5, 0.4)(b), pivot: [1790, 170] }),
  },
];

/* ── «для общественных мест» ─────────────────────────────────────────────────────────────────────────────── */

const pub: Element[] = [
  // Bistro table with two chairs, cups and steam.
  { d: ellipse(280, 150, 90, 10) + `M280 160V246M240 ${F}Q280 240 320 ${F}` },
  { d: chair(118, 193, 1) },
  { d: chair(442, 193, -1) },
  { d: cup(232, 138) + cup(298, 138) },
  { d: wisps(232, 104) + wisps(298, 104), fine: true, motion: steam(26) },
  // Pendant lamps over the bar.
  { d: pendant(840, 16), motion: (b) => ({ rotate: sway(2, 3)(b), pivot: [840, -30] }) },
  { d: pendant(1020, 26), motion: (b) => ({ rotate: sway(2, 3, 1)(b), pivot: [1020, -30] }) },
  { d: pendant(1200, 16), motion: (b) => ({ rotate: sway(2, 3, 2)(b), pivot: [1200, -30] }) },
  // Bar counter with slats; a coffee machine, cups, bottles on it.
  { d: rr(560, 118, 800, 16, 4) + `M590 134V${F}M1330 134V${F}` },
  { d: rr(590, 50, 110, 68, 8) + `M620 50V36H670V50M630 84H660V96M616 118V108M674 118V108` + circle(645, 66, 6) },
  { d: cup(724, 116) },
  { d: wisps(724, 82), fine: true, motion: steam(22) },
  { d: `M1256 118V88Q1256 80 1262 76V58H1270V76Q1276 80 1276 88V118M1292 118V96Q1292 90 1298 86V72H1304V86Q1310 90 1310 96V118M1322 92L1326 118H1336L1340 92` },
  // Stools.
  { d: [840, 1020, 1200].map((x) => `${rr(x - 34, 168, 68, 12, 6)}M${x - 22} 180L${x - 32} ${F}M${x + 22} 180L${x + 32} ${F}M${x - 27} 222H${x + 27}`).join("") },
  // Menu board and a plant, right.
  { d: `M1470 ${F}L1500 96H1600L1630 ${F}M1490 150H1610` + rr(1494, 104, 112, 86, 4) + `M1508 124H1574M1508 144H1592M1508 164H1560` },
  {
    d: pot(1770, 180, 74) + leaf(1770, 180, -32, 92, 20) + leaf(1770, 180, 0, 120, 18) + leaf(1770, 180, 34, 88, 20),
    motion: (b) => ({ rotate: sway(2, 2.5, 0.8)(b), pivot: [1770, 180] }),
  },
];

/** The halls' rooms in P3 order (selection.promo.halls). */
export const PROMO_ROOMS: readonly Element[][] = [home, kids, office, pub];
