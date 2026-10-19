// Sound effect cues of every scene (brief 9.2): `at` in beats from the scene start, gain in dB
// relative to the SFX bus (which itself sits 18–24 dB under the music). Files: public/sfx/<id>.wav, made by
// scripts/make-sfx.mjs (`npm run sfx`); a missing file stays silent. scripts/cues.mjs turns this into out/CUES.md.

export type SfxId =
  | "dot-whoosh"
  | "nail-tap"
  | "wire-creak"
  | "swing"
  | "pencil"
  | "pencil-2"
  | "room-draw-1"
  | "room-draw-2"
  | "room-draw-3"
  | "room-draw-4"
  | "morph-swish"
  | "spin"
  | "ring"
  | "grid-ticks"
  | "plate-slide"
  | "cropmark-tick"
  | "fill-whoosh"
  | "canvas-thump"
  | "bead-drop"
  | "dot-pop"
  | "gradient-swell"
  | "collapse"
  | "switch-click"
  | "whip"
  | "curtain"
  | "staple"
  | "frame-click"
  | "glass-glint"
  | "bead-light"
  | "envelope"
  | "paper-card"
  | "paint-swipe"
  | "paint-splat"
  | "slam"
  | "clock-tick"
  | "thunder"
  | "splash"
  | "bubbles"
  | "wind"
  | "kettle"
  | "birds";

export type Cue = { id: SfxId; at: number; gainDb: number; note?: string };

const every = (id: SfxId, from: number, step: number, n: number, gainDb: number, note?: string): Cue[] =>
  Array.from({ length: n }, (_, i) => ({ id, at: from + i * step, gainDb, note }));

/** Rooms drawn one after another, each with its own take of `room-draw` (from take `first` to 4). */
const rooms = (from: number, step: number, gainDb: number, note: string, first = 1): Cue[] =>
  Array.from({ length: 5 - first }, (_, i) => ({ id: `room-draw-${first + i}` as SfxId, at: from + i * step, gainDb, note }));

export const REELS_CUES: Record<string, Cue[]> = {
  R1: [
    { id: "dot-whoosh", at: 0.25, gainDb: -6, note: "точка прыгает к гвоздю" },
    { id: "nail-tap", at: 1.5, gainDb: -2, note: "точка становится шляпкой гвоздя" },
    { id: "swing", at: 3.25, gainDb: -6, note: "холст падает сверху" },
    { id: "wire-creak", at: 3.7, gainDb: -4, note: "трос ловит холст" },
  ],
  R2: [...every("swing", 0, 1, 4, -10, "качание рамы")],
  R3: [
    { id: "room-draw-1", at: 0, gainDb: -10, note: "нить становится полом, рисуется гостиная" },
    ...every("spin", 2, 2, 3, -6, "холст разворачивается на гвозде"),
    ...rooms(2.25, 2, -12, "рисуется следующая комната", 2),
  ],
  R4: [
    ...every("ring", 0.5, 0.5, 7, -14, "смена работы в круге"),
    { id: "grid-ticks", at: 3.5, gainDb: -10, note: "круг раскрывается на заполняющуюся сетку" },
  ],
  R5: [{ id: "plate-slide", at: 1, gainDb: -8, note: "плашка со счётчиком" }],
  R6: [
    { id: "pencil", at: 0.5, gainDb: -6, note: "эскиз трёх арок" },
    { id: "cropmark-tick", at: 2, gainDb: -6, note: "метки обреза" },
    { id: "fill-whoosh", at: 2.5, gainDb: -6, note: "эскиз заполняется картиной" },
  ],
  R8: [
    { id: "canvas-thump", at: 0, gainDb: -8, note: "холст встаёт ребром" },
    ...every("bead-drop", 1, 1, 3, -6, "бусина"),
    { id: "dot-pop", at: 4, gainDb: -4, note: "точка в «O»" },
    { id: "gradient-swell", at: 8, gainDb: -6, note: "градиент аватара" },
    { id: "collapse", at: 11, gainDb: -6, note: "всё в точку" },
  ],
};

export const PROMO_CUES: Record<string, Cue[]> = {
  P1: [
    { id: "pencil", at: 0, gainDb: -12, note: "в темноте рисуются рамы" },
    { id: "dot-pop", at: 2.5, gainDb: -8, note: "загорается точка" },
    { id: "switch-click", at: 4, gainDb: -4, note: "свет: круг из точки" },
  ],
  P2: [
    { id: "swing", at: 0, gainDb: -8, note: "камера уезжает от рам" },
    { id: "paper-card", at: 0.25, gainDb: -10, note: "«картины»" },
  ],
  P3: [
    ...every("swing", 0, 4, 4, -8, "перелёт к залу"),
    ...rooms(0.5, 4, -14, "рисуется зал"),
    { id: "dot-whoosh", at: 2, gainDb: -8, note: "курсор на «Тихий Паттерн»" },
    { id: "dot-whoosh", at: 10, gainDb: -8, note: "курсор на «Воздушный шар»" },
  ],
  P4: [{ id: "whip", at: 2, gainDb: -4, note: "рывок камеры за лентой" }],
  P5: [
    ...every("ring", 0.5, 0.5, 7, -14, "смена работы в круге"),
    { id: "morph-swish", at: 4, gainDb: -8, note: "круг → арка" },
    { id: "whip", at: 7.25, gainDb: -8, note: "арка пролетает мимо" },
  ],
  P6: [
    { id: "grid-ticks", at: 0, gainDb: -10, note: "сетка" },
    { id: "plate-slide", at: 1, gainDb: -8, note: "плашка" },
    { id: "fill-whoosh", at: 2.25, gainDb: -8, note: "отъезд в шоурум" },
    { id: "room-draw-2", at: 2.5, gainDb: -14, note: "рисуется шоурум" },
  ],
  P7: [
    { id: "plate-slide", at: 1, gainDb: -10, note: "печатающая головка" },
    { id: "canvas-thump", at: 3, gainDb: -8, note: "холст поворачивается тылом" },
    ...every("staple", 4, 0.5, 3, -4, "скоба"),
    { id: "canvas-thump", at: 5.5, gainDb: -10, note: "обратно лицом" },
    ...every("frame-click", 7.5, 0.25, 4, -6, "планка багета"),
    { id: "glass-glint", at: 9, gainDb: -6, note: "блик по стеклу" },
  ],
  P8: [
    { id: "pencil-2", at: 1, gainDb: -8, note: "эскиз" },
    ...every("bead-light", 1, 1, 5, -6, "шаг загорается"),
    { id: "cropmark-tick", at: 2, gainDb: -8, note: "метки обреза" },
    { id: "plate-slide", at: 4, gainDb: -10, note: "проход печати" },
    { id: "envelope", at: 5, gainDb: -6, note: "крафт-конверт" },
    { id: "room-draw-1", at: 6, gainDb: -12, note: "комната с диваном" },
  ],
  P10: [
    { id: "curtain", at: 0, gainDb: -4, note: "шторки" },
    ...every("bead-drop", 1.5, 0.5, 3, -6, "бусина"),
  ],
  P11: [{ id: "dot-pop", at: 0, gainDb: -4, note: "точка в «O» — финальный удар" }],
};
