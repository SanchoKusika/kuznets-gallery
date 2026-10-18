// Scene layout of both videos in bars (brief 7, 8). Plain data: Remotion compositions,
// scripts/make-click-track.mjs and scripts/cues.mjs all read it. The reviews (brief R7, P9) are cut by the owner.

export type SceneSlot = { id: string; name: string; fromBar: number; bars: number };

export const REELS_BARS = 10;
export const PROMO_BARS = 20;

export const REELS_SCENES: SceneSlot[] = [
  { id: "R1", name: "Хук", fromBar: 0, bars: 1 },
  { id: "R2", name: "Примерка", fromBar: 1, bars: 1 },
  { id: "R3", name: "Интерьеры", fromBar: 2, bars: 2 },
  { id: "R4", name: "Круги", fromBar: 4, bars: 1 },
  { id: "R5", name: "Стена", fromBar: 5, bars: 1 },
  { id: "R6", name: "На заказ", fromBar: 6, bars: 1 },
  { id: "R8", name: "Логотип и петля", fromBar: 7, bars: 3 },
];

export const PROMO_SCENES: SceneSlot[] = [
  { id: "P1", name: "Свет в галерее", fromBar: 0, bars: 2 },
  { id: "P2", name: "«картины»", fromBar: 2, bars: 2 },
  { id: "P3", name: "Четыре зала", fromBar: 4, bars: 4 },
  { id: "P4", name: "Волна", fromBar: 8, bars: 1 },
  { id: "P5", name: "По форме", fromBar: 9, bars: 2 },
  { id: "P6", name: "Стена и шоурум", fromBar: 11, bars: 1 },
  { id: "P7", name: "Ремесло", fromBar: 12, bars: 3 },
  { id: "P8", name: "По вашей идее", fromBar: 15, bars: 2 },
  { id: "P10", name: "Шторки и логотип", fromBar: 17, bars: 1 },
  { id: "P11", name: "Финал", fromBar: 18, bars: 2 },
];
