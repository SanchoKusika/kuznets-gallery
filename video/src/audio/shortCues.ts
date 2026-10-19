import type { SfxId } from "./cues";

// Sound of the short reels: the track (scripts/make-reels-music.mjs) and the effects, each at a beat of the reel
// (absolute, 120 BPM) with a gain in dB relative to the SFX bus. Scene starts: src/ad/layout.ts, src/showreel/layout.ts.

export type ShortCue = { id: SfxId; beat: number; gainDb: number; note?: string };

const many = (id: SfxId, beats: number[], gainDb: number, note?: string): ShortCue[] => beats.map((beat) => ({ id, beat, gainDb, note }));

export const AD_MUSIC = "audio/ad.wav";
export const SHOWREEL_MUSIC = "audio/showreel.wav";

export const AD_CUES: ShortCue[] = [
  // A1
  { id: "dot-whoosh", beat: 0.5, gainDb: -10, note: "точка падает" },
  { id: "dot-pop", beat: 1, gainDb: -4, note: "точка приземляется" },
  { id: "fill-whoosh", beat: 1.25, gainDb: -10, note: "точка раскрывается в картину" },
  { id: "paint-swipe", beat: 2, gainDb: -2, note: "зачёркивает «пустая»" },
  { id: "morph-swish", beat: 2.45, gainDb: -12, note: "«пустая» → «яркая»" },
  { id: "paint-swipe", beat: 2.55, gainDb: -10, note: "жёлтая подложка" },
  ...many("dot-pop", [3, 3.25, 3.5], -14, "маленькие картины"),
  { id: "paint-splat", beat: 3.25, gainDb: -8, note: "клякса на картине" },
  { id: "paint-swipe", beat: 3.5, gainDb: -12, note: "белый мазок" },
  // A2
  { id: "swing", beat: 4, gainDb: -10, note: "стена слетается" },
  { id: "grid-ticks", beat: 4.1, gainDb: -12, note: "плитки" },
  { id: "paint-swipe", beat: 5.5, gainDb: -12, note: "подложка «авторских»" },
  { id: "pencil-2", beat: 5.5, gainDb: -12, note: "кольцо вокруг 159" },
  { id: "plate-slide", beat: 6, gainDb: -6, note: "колонки съезжают" },
  { id: "whip", beat: 7, gainDb: -6, note: "наезд в плитку" },
  // A3
  { id: "paint-swipe", beat: 8.1, gainDb: -14, note: "сердце" },
  ...many("paint-swipe", [8.75, 9.75, 10.75], -6, "картина закрашивается следующей"),
  ...many("morph-swish", [8.9, 9.9, 10.9], -14, "слово комнаты"),
  // A4
  { id: "paint-swipe", beat: 12, gainDb: -6, note: "KZ-024" },
  { id: "spin", beat: 12.5, gainDb: -8, note: "холст в 3D" },
  ...many("frame-click", [13.4, 13.5, 13.6, 13.7], -8, "планки багета"),
  { id: "swing", beat: 13.75, gainDb: -8, note: "переворот" },
  { id: "glass-glint", beat: 14.5, gainDb: -6, note: "блик" },
  { id: "whip", beat: 15.5, gainDb: -8, note: "уходит вверх" },
  // A5
  { id: "pencil", beat: 16, gainDb: -6, note: "эскиз арок" },
  { id: "paint-swipe", beat: 17, gainDb: -4, note: "краска приносит картину" },
  { id: "morph-swish", beat: 17.5, gainDb: -12, note: "«нарисуем.»" },
  { id: "paint-swipe", beat: 18.05, gainDb: -12, note: "подложка «за 3–7 дней»" },
  // A6
  ...many("paper-card", [19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5], -14, "кадр монтажа"),
  ...many("paint-splat", [19.6, 20.6, 21.6, 22.6, 23.6], -14, "клякса"),
  // A7
  { id: "collapse", beat: 24, gainDb: -6, note: "картина в точку" },
  ...many("bead-drop", [24.5, 24.75, 25], -8, "бусины"),
  { id: "paint-swipe", beat: 26, gainDb: -10, note: "жёлтый мазок" },
  { id: "switch-click", beat: 26.15, gainDb: -10, note: "kuznets.uz" },
  { id: "ring", beat: 26.5, gainDb: -14, note: "вдох точки" },
];

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
