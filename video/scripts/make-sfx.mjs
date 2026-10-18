// Sound effects of both videos (brief 9.2), synthesised here — no samples, no licences. One file per cue id in
// public/sfx/<id>.wav, mono content in a stereo file, peak at −1 dBFS; the level in the mix comes from
// src/audio/cues.ts (gain per cue) and the SFX bus in Soundtrack.tsx.
//
//   npm run sfx

import fs from "node:fs";
import path from "node:path";
import { dbGain, env, filter, noise, pluck, RATE, reverb, rng, writeWav } from "./audio/dsp.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "public/sfx");
fs.mkdirSync(dir, { recursive: true });
const rand = rng(918);

const len = (s) => Math.ceil(s * RATE);
const make = (s, fn) => Float32Array.from({ length: len(s) }, (_, i) => fn(i / RATE, i));
const mul = (a, b) => a.map((v, i) => v * (b[i] ?? 0));
const add = (...xs) => {
  const out = new Float32Array(Math.max(...xs.map((x) => x.length)));
  for (const x of xs) x.forEach((v, i) => (out[i] += v));
  return out;
};
const delay = (x, s) => {
  const d = len(s);
  const out = new Float32Array(x.length + d);
  out.set(x, d);
  return out;
};
const sine = (s, f, ph = 0) => make(s, (t) => Math.sin(2 * Math.PI * (typeof f === "function" ? f(t) : f) * t + ph));
/** Sine with a frequency curve (integrated phase). */
const glide = (s, f) => {
  let ph = 0;
  return make(s, (t) => {
    ph += (2 * Math.PI * f(t)) / RATE;
    return Math.sin(ph);
  });
};
/** Noise through a bandpass that moves (whooshes). */
const sweptNoise = (s, f, q = 1.2) => filter(noise(len(s), rand), "bp", (i) => f(i / RATE), q);
/** A little room around a dry sound. */
const room = (x, wet = 0.25, size = 0.7) => {
  const tail = new Float32Array(x.length + len(0.8));
  tail.set(x);
  const r = reverb({ L: tail, R: tail }, { room: size, damp: 0.5 });
  return tail.map((v, i) => v + (r.L[i] + r.R[i]) * 0.5 * wet);
};
/** Fades the ends so nothing clicks. */
const ends = (x, fadeIn = 0.002, fadeOut = 0.03) =>
  x.map((v, i) => v * Math.min(1, i / (fadeIn * RATE)) * Math.min(1, (x.length - i) / (fadeOut * RATE)));

const whoosh = (s, f0, f1, curve = 1.5) => {
  const x = sweptNoise(s, (t) => f0 * (f1 / f0) ** ((t / s) ** curve), 1.6);
  return mul(x, make(s, (t) => Math.sin(Math.PI * (t / s) ** 0.8) ** 2));
};
const tick = (f = 3200, tau = 0.004) => add(mul(sine(0.05, f), env(len(0.05), { attack: 0.0004, tau })), mul(filter(noise(len(0.05), rand), "hp", 4000), env(len(0.05), { attack: 0.0002, tau: tau / 2 })));
const thud = (f = 70, tau = 0.12) => add(mul(glide(0.5, (t) => f + 60 * Math.exp(-t / 0.02)), env(len(0.5), { tau })), mul(filter(noise(len(0.5), rand), "lp", 900), env(len(0.5), { tau: tau / 3 })));
/** Wooden knock: a few inharmonic modes. */
const knock = (f = 900, tau = 0.03) => add(...[1, 2.32, 4.25].map((k, j) => mul(sine(0.2, f * k), env(len(0.2), { attack: 0.0005, tau: tau / (j + 1) })).map((v) => v / (j + 1))));
const bell = (f, s = 1.2) => add(...[1, 2.76, 5.4].map((k, j) => mul(sine(s, f * k), env(len(s), { attack: 0.001, tau: s / (2 + j * 2) })).map((v) => v * [1, 0.4, 0.15][j])));

const SFX = {
  // The dot hops off its rest towards the nail.
  "dot-whoosh": () => whoosh(0.5, 500, 3000),
  // The dot lands and becomes a nail: a small hammer tap on plaster.
  "nail-tap": () => room(add(knock(1400, 0.02), thud(110, 0.05).map((v) => v * 0.6)), 0.15),
  // The wire catches the falling canvas: a low metallic twang.
  "wire-creak": () => room(add(pluck(98, 1.2, rand, { damp: 0.2, bright: 0.9 }).map((v) => v * 0.8), pluck(147, 1.2, rand, { damp: 0.3, bright: 0.9 }).map((v) => v * 0.4), thud(60, 0.08).map((v) => v * 0.5)), 0.2),
  // A canvas swinging past: a soft air movement.
  swing: () => whoosh(0.45, 300, 900, 1),
  // Pencil on paper: scratchy noise in strokes.
  pencil: () => {
    const s = 1.4;
    const x = filter(filter(noise(len(s), rand), "bp", 3800, 0.8), "hp", 1500);
    return mul(x, make(s, (t) => (0.35 + 0.65 * Math.abs(Math.sin(2 * Math.PI * 3.3 * t + Math.sin(7 * t)))) * Math.min(1, t / 0.05) * Math.min(1, (s - t) / 0.2)));
  },
  "morph-swish": () => whoosh(0.4, 900, 4500),
  // The canvas spins round on the nail: a quick rising-falling air sweep.
  spin: () => add(whoosh(0.55, 400, 2400, 1), delay(whoosh(0.3, 2400, 700, 1), 0.25).map((v) => v * 0.6)),
  // A ring leaves the circle: a quiet glassy ping.
  ring: () => room(bell(1568, 0.8), 0.3),
  // Tiles filling the wall: a quick run of light ticks.
  "grid-ticks": () => add(...Array.from({ length: 14 }, (_, k) => delay(tick(2600 + (k % 3) * 400), k * 0.034).map((v) => v * (0.5 + 0.5 * Math.sin((Math.PI * k) / 14))))),
  // The plate slides in: paper on paper.
  "plate-slide": () => mul(filter(noise(len(0.5), rand), "bp", 2200, 0.6), make(0.5, (t) => Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 1.5)),
  "cropmark-tick": () => add(tick(4200, 0.003), delay(tick(4600, 0.003), 0.06).map((v) => v * 0.7)),
  // The sketch fills with the picture: a soft swell.
  "fill-whoosh": () => room(whoosh(0.8, 300, 2000, 0.8), 0.3),
  // The canvas turns onto its edge: a low wooden thump.
  "canvas-thump": () => room(add(thud(80, 0.1), knock(320, 0.04).map((v) => v * 0.4)), 0.15),
  // A bead drops and bounces three times.
  "bead-drop": () => add(...[0, 0.11, 0.18].map((d, k) => delay(knock(2100, 0.02), d).map((v) => v * [1, 0.5, 0.25][k]))),
  // The dot pops: a quick pitch-dropping blip.
  "dot-pop": () => room(mul(glide(0.18, (t) => 900 * Math.exp(-t / 0.03) + 300), env(len(0.18), { attack: 0.001, tau: 0.04 })), 0.2),
  // The avatar gradient opens: a warm major swell.
  "gradient-swell": () => {
    const s = 2;
    const x = add(...[60, 64, 67, 71].map((m) => sine(s, 440 * 2 ** ((m + 12 - 69) / 12)).map((v) => v * 0.25)));
    return room(mul(x, make(s, (t) => Math.sin((Math.PI / 2) * Math.min(1, t / 1.2)) * Math.min(1, (s - t) / 0.6))), 0.4);
  },
  // Everything collapses into the dot: a reverse whoosh into a click.
  collapse: () => add(whoosh(0.5, 3000, 300, 0.7), delay(tick(1800, 0.006), 0.46)),
  // Promo.
  "switch-click": () => room(add(tick(2400, 0.005), delay(tick(1600, 0.008), 0.03)), 0.2),
  "room-tone": () => filter(noise(len(4), rand), "lp", 400).map((v, i, a) => v * 0.4 * Math.min(1, i / RATE / 1, (a.length - i) / RATE / 1)),
  whip: () => whoosh(0.35, 600, 6000, 2),
  curtain: () => add(whoosh(0.5, 400, 2500), delay(whoosh(0.45, 500, 3000), 0.07).map((v) => v * 0.7), delay(whoosh(0.4, 600, 3500), 0.14).map((v) => v * 0.5)),
  staple: () => add(thud(160, 0.03), tick(3000, 0.004), delay(knock(1300, 0.015), 0.012).map((v) => v * 0.5)),
  "frame-click": () => add(knock(1700, 0.012), tick(3500, 0.002).map((v) => v * 0.6)),
  "glass-glint": () => room(add(bell(2637, 1), delay(bell(3951, 0.8), 0.04).map((v) => v * 0.5)), 0.4),
  "bead-light": () => room(bell(1175, 0.6), 0.2),
  envelope: () => mul(filter(noise(len(0.7), rand), "bp", 1800, 0.5), make(0.7, (t) => Math.sin(Math.PI * Math.min(1, t / 0.7)) * (0.6 + 0.4 * Math.sin(18 * t)))),
  "paper-card": () => mul(filter(noise(len(0.3), rand), "bp", 2600, 0.8), env(len(0.3), { attack: 0.01, tau: 0.08 })),
};

for (const [id, fn] of Object.entries(SFX)) {
  const x = ends(fn());
  const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const g = dbGain(-1) / peak;
  const y = x.map((v) => v * g);
  writeWav(path.join(dir, `${id}.wav`), { L: y, R: y });
}
console.log(`${Object.keys(SFX).length} effects → public/sfx/`);
