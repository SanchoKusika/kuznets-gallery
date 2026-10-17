// Click track standing in for the music: WAV 48 kHz, 16-bit stereo, BPM from src/theme/timing.ts.
// A click on every beat (louder on the first beat of a bar) and a short tone at the start of every scene.
//
//   npm run click   → public/audio/click-reels.wav (12 bars), public/audio/click-promo.wav (22 bars)

import fs from "node:fs";
import path from "node:path";
import { PROMO_BARS, PROMO_SCENES, REELS_BARS, REELS_SCENES } from "../src/timeline.ts";

const root = path.resolve(import.meta.dirname, "..");
const BPM = Number(fs.readFileSync(path.join(root, "src/theme/timing.ts"), "utf8").match(/BPM = (\d+(?:\.\d+)?)/)[1]);
const RATE = 48000;
const beatSec = 60 / BPM;

function render(bars, scenes) {
  const total = Math.round(bars * 4 * beatSec * RATE);
  const mix = new Float32Array(total);
  const add = (at, len, fn) => {
    const s0 = Math.round(at * RATE);
    for (let i = 0; i < len * RATE && s0 + i < total; i++) mix[s0 + i] += fn(i / RATE);
  };
  for (let n = 0; n < bars * 4; n++) {
    const down = n % 4 === 0;
    const f = down ? 1600 : 1100;
    const gain = down ? 0.55 : 0.3;
    add(n * beatSec, 0.03, (t) => gain * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 160));
  }
  for (const s of scenes) {
    // Two-note marker (A5 → E6), soft attack, 160 ms.
    add(s.fromBar * 4 * beatSec, 0.16, (t) => 0.22 * Math.sin(2 * Math.PI * (t < 0.07 ? 880 : 1318.5) * t) * Math.min(1, t * 200) * Math.exp(-t * 14));
  }
  const pcm = Buffer.alloc(44 + total * 4);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(36 + total * 4, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20); // PCM
  pcm.writeUInt16LE(2, 22); // stereo
  pcm.writeUInt32LE(RATE, 24);
  pcm.writeUInt32LE(RATE * 4, 28);
  pcm.writeUInt16LE(4, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(total * 4, 40);
  for (let i = 0; i < total; i++) {
    const v = Math.max(-1, Math.min(1, mix[i])) * 32767;
    pcm.writeInt16LE(Math.round(v), 44 + i * 4);
    pcm.writeInt16LE(Math.round(v), 46 + i * 4);
  }
  return { pcm, seconds: total / RATE };
}

const dir = path.join(root, "public/audio");
fs.mkdirSync(dir, { recursive: true });
for (const [name, bars, scenes] of [["click-reels.wav", REELS_BARS, REELS_SCENES], ["click-promo.wav", PROMO_BARS, PROMO_SCENES]]) {
  const { pcm, seconds } = render(bars, scenes);
  fs.writeFileSync(path.join(dir, name), pcm);
  console.log(`${name}: ${seconds.toFixed(2)} s, ${BPM} BPM`);
}
