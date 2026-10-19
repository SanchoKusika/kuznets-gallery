import type { SfxId } from "./cues";

// Sound of the short reels: the track (scripts/make-reels-music.mjs) and the effects, each at a beat of the reel
// (absolute, 120 BPM) with a gain in dB relative to the SFX bus. Scene starts: the reels' layout.ts.

export type ShortCue = { id: SfxId; beat: number; gainDb: number; note?: string };

const many = (id: SfxId, beats: number[], gainDb: number, note?: string): ShortCue[] => beats.map((beat) => ({ id, beat, gainDb, note }));

export const SHOWREEL_MUSIC = "audio/showreel.wav";
export const ROOM_MUSIC = "audio/room.wav";

export const SHOWREEL_CUES: ShortCue[] = [
  // S1
  { id: "dot-pop", beat: 0, gainDb: -4, note: "точка" },
  { id: "dot-pop", beat: 0.5, gainDb: -12, note: "удар точки" },
  { id: "spin", beat: 1, gainDb: -10, note: "бусины по орбите" },
  { id: "whip", beat: 1.5, gainDb: -10, note: "волна" },
  { id: "fill-whoosh", beat: 1.7, gainDb: -6, note: "волна заливает кадр" },
  // S2: a letter every 4 frames
  ...many("slam", Array.from({ length: 10 }, (_, i) => 2 + (i * 4) / 30), -10, "буква"),
  { id: "dot-pop", beat: 3.8, gainDb: -8, note: "точка в «O»" },
  { id: "whip", beat: 4, gainDb: -4, note: "пролёт сквозь «O»" },
  // S3
  ...many("morph-swish", [5.85, 6.85, 7.85], -8, "смена формы"),
  ...many("ring", [5, 6, 7, 8], -14, "кольца"),
  { id: "fill-whoosh", beat: 8.5, gainDb: -8, note: "белый круг" },
  // S4
  { id: "grid-ticks", beat: 9, gainDb: -8, note: "полосы влетают" },
  { id: "plate-slide", beat: 10, gainDb: -8, note: "полосы сверху" },
  { id: "whip", beat: 11, gainDb: -10, note: "ряды с боков" },
  { id: "grid-ticks", beat: 12, gainDb: -10, note: "плитки переворачиваются" },
  { id: "spin", beat: 12.75, gainDb: -6, note: "уходит вращаясь" },
  // S5
  ...many("swing", [14, 15, 16], -8, "кольцо поворачивается"),
  { id: "collapse", beat: 16.5, gainDb: -8, note: "кольцо складывается" },
  // S6
  { id: "whip", beat: 17, gainDb: -8, note: "стена" },
  { id: "slam", beat: 17.25, gainDb: -4, note: "159" },
  { id: "slam", beat: 18, gainDb: -8, note: "работ" },
  { id: "fill-whoosh", beat: 19.5, gainDb: -10, note: "стена отъезжает" },
  // S7
  ...many("slam", [21, 22, 23, 24], -10, "слово"),
  ...many("paper-card", [21.5, 22.5, 23.5, 24.5], -10, "слово"),
  // S8
  ...many("bead-drop", [25.32, 25.57, 25.82], -8, "бусины"),
  { id: "dot-pop", beat: 26.25, gainDb: -4, note: "точка логотипа" },
  { id: "ring", beat: 26.35, gainDb: -10, note: "кольца" },
  { id: "switch-click", beat: 27, gainDb: -12, note: "kuznets.uz" },
];

/** «Одна картина меняет всю комнату» (src/room/layout.ts): rooms start on beats 3, 6, … 21. */
export const ROOM_CUES: ShortCue[] = [
  ...many("clock-tick", [0, 2], -6, "часы в скучной комнате"),
  { id: "dot-whoosh", beat: 2.5, gainDb: -8, note: "картина падает" },
  { id: "canvas-thump", beat: 2.83, gainDb: -4, note: "картина на гвозде" },
  { id: "nail-tap", beat: 2.83, gainDb: -10 },
  ...many("spin", [5.8, 8.8, 11.8, 14.8, 17.8, 20.8], -12, "картина переворачивается"),
  ...many("fill-whoosh", [3, 6, 9, 12, 15, 18, 21], -8, "мир разливается из картины"),
  // Jungle
  { id: "swing", beat: 3, gainDb: -10, note: "листья" },
  { id: "birds", beat: 3.3, gainDb: -6, note: "попугай" },
  { id: "birds", beat: 4.4, gainDb: -12 },
  // Rain
  { id: "dot-pop", beat: 6.35, gainDb: -8, note: "зонт" },
  { id: "thunder", beat: 7.4, gainDb: -2, note: "молния" },
  // Water
  { id: "splash", beat: 9, gainDb: -2, note: "комнату заливает" },
  ...many("bubbles", [9.6, 10.8], -8, "пузыри"),
  // Space
  { id: "glass-glint", beat: 12.1, gainDb: -8, note: "звёзды" },
  { id: "whip", beat: 13.4, gainDb: -10, note: "комета" },
  // Desert
  { id: "wind", beat: 15, gainDb: -6, note: "ветер" },
  { id: "dot-pop", beat: 15.15, gainDb: -10, note: "кактус" },
  { id: "swing", beat: 16.1, gainDb: -8, note: "перекати-поле" },
  // Sky
  { id: "dot-pop", beat: 18.1, gainDb: -12, note: "шарики" },
  { id: "swing", beat: 18.25, gainDb: -10, note: "абажур улетает" },
  // Tea
  { id: "kettle", beat: 21, gainDb: -6, note: "чайник" },
  ...many("dot-pop", [21.1, 21.2, 21.3, 21.4, 21.5], -14, "дастархан"),
  // Montage, choice, logo
  ...many("paper-card", Array.from({ length: 12 }, (_, i) => 24 + i / 4), -14, "картина"),
  { id: "slam", beat: 27, gainDb: -8, note: "какая твоя?" },
  { id: "slam", beat: 27.25, gainDb: -10 },
  ...many("dot-pop", Array.from({ length: 7 }, (_, i) => 27.15 + i * 0.067), -16, "плитки"),
  { id: "fill-whoosh", beat: 30, gainDb: -8, note: "логотип" },
  ...many("bead-drop", [30.5, 30.75, 31], -8, "бусины"),
  { id: "dot-pop", beat: 31.5, gainDb: -4, note: "точка" },
  { id: "switch-click", beat: 32, gainDb: -10, note: "kuznets.uz" },
];
