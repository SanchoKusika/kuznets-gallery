// Sound effects of both videos (brief 9.2), synthesised here — no samples, no licences. One file per cue id in
// public/sfx/<id>.wav, a stereo file (mono content unless the effect pans), peak at −1 dBFS; the level in the mix comes from
// src/audio/cues.ts (gain per cue) and the SFX bus in Soundtrack.tsx.
//
//   npm run sfx

import fs from "node:fs";
import path from "node:path";
import { bus, dbGain, env, filter, midiHz, mixInto, noise, pingPong, pluck, put, RATE, reverb, rng, writeWav } from "./audio/dsp.mjs";

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

/**
 * Graphite on paper, one stroke: the tip speeds up and slows down (`v`), and the sound is mostly grain — sparse
 * clicks whose density follows the speed — with a little friction hiss, through the paper's resonances. Steady
 * filtered noise (the old version) reads as a floor brush; the grain and the lifts between strokes read as a pencil.
 */
function graphiteStroke(s, r, { density = 520, hiss = 0.1, tone = 1 } = {}) {
  const n = len(s);
  const v = make(s, (t) => Math.sin(Math.PI * (t / s)) ** 0.7);
  const grain = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (r() > (density * v[i]) / RATE) continue;
    const a = (r() * 2 - 1) * r() ** 3; // mostly tiny ticks, now and then a crisp one
    grain[i] += a;
    if (i + 1 < n) grain[i + 1] -= a * 0.6;
  }
  const fric = mul(filter(noise(n, r), "bp", (i) => (2600 + 2400 * v[i]) * tone, 1.4), v).map((x) => x * hiss);
  const dry = filter(add(grain, fric), "hp", 1200);
  // Paper over a table: a few broad bumps; the stroke direction tilts them a little (`tone`).
  const body = add(...[1800, 3400, 6000].map((f, k) => filter(Float32Array.from(dry), "bp", f * tone, 3).map((x) => x * [0.7, 1, 0.5][k])));
  const out = filter(add(dry.map((x) => x * 0.6), body), "lp", 9000);
  // The tip touching down.
  return add(out, tick(2600 * tone, 0.003).map((x) => x * 0.05));
}

/** A run of strokes with lifts in between, tanh-tamed so the grain does not set the level alone. */
function graphite(total, seed, opts = {}) {
  const r = rng(seed);
  const parts = [];
  let at = 0;
  let up = true;
  while (at < total - 0.08) {
    const s = Math.min(total - at, 0.06 + r() * 0.16);
    const k = 0.5 + 0.5 * r();
    parts.push(delay(graphiteStroke(s, r, { ...opts, tone: (opts.tone ?? 1) * (up ? 1.06 : 0.94) }), at).map((x) => x * k));
    at += s + 0.02 + r() * 0.07;
    up = !up;
  }
  return add(...parts).map((x) => Math.tanh(x * 1.2));
}

// C major pentatonic from C5: fits every chord of the track (Dm9 – G13 – Cmaj9 – Am9).
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93];
/** A music-box tine: sine with a faint octave and twelfth, a tiny strike click, quick ring. */
const tine = (m, s = 0.9) => {
  const f = midiHz(m);
  const x = add(...[1, 2, 3].map((k, j) => mul(sine(s, f * k), env(len(s), { attack: 0.0015, tau: [0.32, 0.12, 0.05][j] })).map((v) => v * [1, 0.18, 0.06][j])));
  return add(x, tick(5200, 0.002).map((v) => v * 0.08));
};

/**
 * A room drawn in a sweep from left to right: a light pencil run plus a rising music-box ripple panned the same way —
 * the drawing coming to life. `notes` are steps of PENTA; each room has its own contour so repeats do not sound alike.
 */
function roomDraw(notes, seed, s = 0.9) {
  const r = rng(seed);
  const b = bus(s + 1.6);
  const pencilRun = graphite(s, seed + 1, { density: 400 });
  // The pencil follows the sweep across the room.
  for (let k = 0; k < 4; k++) {
    const a = len((s * k) / 4);
    const piece = pencilRun.slice(a, len((s * (k + 1)) / 4));
    put(b, a / RATE, piece, 0.42, -0.6 + (1.2 * k) / 3);
  }
  notes.forEach((step, k) => {
    const at = (s * 0.92 * k) / (notes.length - 1) + (r() - 0.5) * 0.012;
    const last = k === notes.length - 1;
    put(b, Math.max(0, at), tine(PENTA[step], last ? 1.4 : 0.9), (0.42 + 0.22 * r()) * (last ? 1.15 : 1), -0.6 + (1.2 * k) / (notes.length - 1));
  });
  mixInto(b, reverb(b, { room: 0.78, damp: 0.45 }), 0.22);
  mixInto(b, pingPong(b, 0.18, 0.3, 4200), 0.14);
  return b;
}

const SFX = {
  // The dot hops off its rest towards the nail.
  "dot-whoosh": () => whoosh(0.5, 500, 3000),
  // The dot lands and becomes a nail: a small hammer tap on plaster.
  "nail-tap": () => room(add(knock(1400, 0.02), thud(110, 0.05).map((v) => v * 0.6)), 0.15),
  // The wire catches the falling canvas: a low metallic twang.
  "wire-creak": () => room(add(pluck(98, 1.2, rand, { damp: 0.2, bright: 0.9 }).map((v) => v * 0.8), pluck(147, 1.2, rand, { damp: 0.3, bright: 0.9 }).map((v) => v * 0.4), thud(60, 0.08).map((v) => v * 0.5)), 0.2),
  // A canvas swinging past: a soft air movement.
  swing: () => whoosh(0.45, 300, 900, 1),
  // Pencil sketching lines (frames, the arches): graphite strokes with lifts; two takes so repeats differ.
  pencil: () => room(graphite(1.3, 31), 0.12, 0.4),
  "pencil-2": () => room(graphite(1.1, 57, { tone: 0.92 }), 0.12, 0.4),
  // Rooms drawn in a sweep: pencil + a rising music-box ripple, a contour per room.
  "room-draw-1": () => roomDraw([0, 2, 1, 3, 4, 6, 5, 7], 101),
  "room-draw-2": () => roomDraw([1, 2, 4, 3, 5, 6, 8], 202),
  "room-draw-3": () => roomDraw([0, 1, 3, 2, 4, 5, 7, 9], 303),
  "room-draw-4": () => roomDraw([2, 3, 5, 4, 6, 7, 9], 404),
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
  // An effect is mono (a Float32Array) or a stereo bus {L, R} (the room sweep pans left → right).
  const out = fn();
  const ch = out instanceof Float32Array ? [ends(out)] : [ends(out.L), ends(out.R)];
  const peak = Math.max(...ch.map((x) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0))) || 1;
  const [L, R = L] = ch.map((x) => x.map((v) => (v * dbGain(-1)) / peak));
  writeWav(path.join(dir, `${id}.wav`), { L, R });
}
console.log(`${Object.keys(SFX).length} effects → public/sfx/`);
