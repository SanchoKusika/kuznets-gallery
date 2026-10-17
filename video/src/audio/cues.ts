// Sound effect cues of every scene (brief 9.2): `at` in beats from the scene start, gain in dB
// relative to the SFX bus (which itself sits 18–24 dB under the music). Files: public/sfx/<id>.wav;
// a missing file stays silent. scripts/cues.mjs turns this into out/CUES.md.

export type SfxId =
  | "dot-whoosh"
  | "nail-tap"
  | "wire-creak"
  | "swing"
  | "pencil"
  | "morph-swish"
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
  | "room-tone"
  | "whip"
  | "curtain"
  | "staple"
  | "frame-click"
  | "glass-glint"
  | "bead-light"
  | "envelope"
  | "paper-card";

export type Cue = { id: SfxId; at: number; gainDb: number; note?: string };

const every = (id: SfxId, from: number, step: number, n: number, gainDb: number, note?: string): Cue[] =>
  Array.from({ length: n }, (_, i) => ({ id, at: from + i * step, gainDb, note }));

export const REELS_CUES: Record<string, Cue[]> = {
  R1: [
    { id: "dot-whoosh", at: 0, gainDb: -6, note: "точка входит справа" },
    { id: "nail-tap", at: 2, gainDb: -2, note: "точка становится шляпкой гвоздя" },
  ],
  R2: [
    { id: "wire-creak", at: 0, gainDb: -6, note: "первое качание" },
    ...every("swing", 0, 1, 4, -8, "качание рамы"),
  ],
  R3: [
    { id: "pencil", at: 0, gainDb: -6, note: "рисуется диван" },
    ...every("morph-swish", 2, 2, 3, -8, "интерьер перетекает"),
  ],
  R4: every("ring", 0.5, 0.5, 7, -14, "смена работы в круге"),
  R5: [
    { id: "grid-ticks", at: 0, gainDb: -10, note: "сетка заполняется" },
    { id: "plate-slide", at: 1, gainDb: -8, note: "плашка со счётчиком" },
  ],
  R6: [
    { id: "pencil", at: 0.5, gainDb: -6, note: "эскиз трёх арок" },
    { id: "cropmark-tick", at: 2, gainDb: -6, note: "метки обреза" },
    { id: "fill-whoosh", at: 2.5, gainDb: -6, note: "эскиз заполняется картиной" },
  ],
  R7: [{ id: "canvas-thump", at: 0, gainDb: -8, note: "холст поворачивается в 3D" }],
  R8: [
    ...every("bead-drop", 1, 1, 3, -6, "бусина"),
    { id: "dot-pop", at: 4, gainDb: -4, note: "точка в «O»" },
    { id: "gradient-swell", at: 8, gainDb: -6, note: "градиент аватара" },
    { id: "collapse", at: 11, gainDb: -6, note: "всё в точку" },
  ],
};

export const PROMO_CUES: Record<string, Cue[]> = {
  P1: [
    { id: "dot-whoosh", at: 2.5, gainDb: -10, note: "загорается точка" },
    { id: "switch-click", at: 4, gainDb: -4, note: "свет: круг из точки" },
    { id: "room-tone", at: 4, gainDb: -18, note: "тон зала" },
  ],
  P2: [{ id: "paper-card", at: 0.25, gainDb: -10, note: "«картины»" }],
  P3: [
    ...every("morph-swish", 0, 4, 4, -10, "перелёт к залу"),
    { id: "dot-whoosh", at: 2, gainDb: -10, note: "курсор на «Тихий Паттерн»" },
    { id: "dot-whoosh", at: 10, gainDb: -10, note: "курсор на «Воздушный шар»" },
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
    { id: "room-tone", at: 2.5, gainDb: -18, note: "шоурум" },
  ],
  P7: [
    { id: "canvas-thump", at: 3, gainDb: -8, note: "холст поворачивается тылом" },
    ...every("staple", 4, 0.5, 3, -4, "скоба"),
    { id: "canvas-thump", at: 5.5, gainDb: -10, note: "обратно лицом" },
    ...every("frame-click", 7.5, 0.25, 4, -6, "планка багета"),
    { id: "glass-glint", at: 9, gainDb: -6, note: "блик по стеклу" },
  ],
  P8: [
    { id: "pencil", at: 1, gainDb: -8, note: "эскиз" },
    ...every("bead-light", 1, 1, 5, -6, "шаг загорается"),
    { id: "cropmark-tick", at: 2, gainDb: -8, note: "метки обреза" },
    { id: "envelope", at: 5, gainDb: -6, note: "крафт-конверт" },
  ],
  P9: [...every("paper-card", 0.25, 2.25, 3, -12, "отзыв")],
  P10: [
    { id: "curtain", at: 0, gainDb: -4, note: "шторки" },
    ...every("bead-drop", 1.5, 0.5, 3, -6, "бусина"),
  ],
  P11: [{ id: "dot-pop", at: 0, gainDb: -4, note: "точка в «O» — финальный удар" }],
};
