// «Одна картина меняет всю комнату» (1080×1920, 120 BPM, 34 beats = 17 s): one drawn room, a cat on the sofa, and a
// painting on the nail that changes every three beats — and the room turns into the painting's world each time.
// Geometry of the room (one-point perspective) and the scene table live here.

export const ROOM_BPM = 120;
export const ROOM_BEATS = 34;

export const INK = "#151515";
export const LINE = 5;
export const FINE = 3;

/** Vanishing point and the back wall. */
export const VP = { x: 540, y: 900 } as const;
export const BACK = { x0: 110, x1: 970, y0: 500, y1: 1330 } as const;

/** A point of the room's perspective: from the vanishing point through (x, y) on the back wall, out to `k` (1 = wall). */
export const persp = (x: number, y: number, k: number): [number, number] => [VP.x + (x - VP.x) * k, VP.y + (y - VP.y) * k];

/** Painting on the nail (centre of the hanging box) and the nail. */
export const NAIL = { x: 430, y: 560 } as const;
export const PAINT_BOX = 400;
export const PAINT_TOP = 610;

/** Window on the back wall, right of the painting. */
export const WIN = { x0: 720, x1: 910, y0: 600, y1: 890 } as const;

/** Beats: the intro, seven rooms of three beats, the montage, the choice, the logo. */
export const T = {
  hang: 2.5,
  first: 3,
  per: 3,
  montage: 24,
  choice: 27,
  logo: 30,
} as const;

export type SceneKey = "jungle" | "rain" | "water" | "space" | "desert" | "sky" | "tea";

export type Scene = {
  key: SceneKey;
  code: string;
  /** Multiply tint over the room (the painting's world). */
  tint: string;
  /** Strength of the tint, 0…1. */
  tintK: number;
};

export const SCENES: Scene[] = [
  { key: "jungle", code: "KZ-036", tint: "#8CCB6A", tintK: 0.85 },
  { key: "rain", code: "KZ-070", tint: "#7D93B3", tintK: 0.9 },
  { key: "water", code: "KZ-076", tint: "#86C2E0", tintK: 0.85 },
  { key: "space", code: "KZ-082", tint: "#2E3566", tintK: 1 },
  { key: "desert", code: "KZ-009", tint: "#F4BE7E", tintK: 0.9 },
  { key: "sky", code: "KZ-134", tint: "#A9C8F5", tintK: 0.8 },
  { key: "tea", code: "KZ-032", tint: "#F3A47C", tintK: 0.8 },
];

/** Beat where scene k starts. */
export const sceneStart = (k: number) => T.first + k * T.per;

/** The montage after the seven rooms: more paintings on the nail, a quarter beat each. */
export const MONTAGE = ["KZ-010", "KZ-022", "KZ-069", "KZ-047", "KZ-097", "KZ-012", "KZ-121", "KZ-001", "KZ-089", "KZ-064", "KZ-113", "KZ-024"];
