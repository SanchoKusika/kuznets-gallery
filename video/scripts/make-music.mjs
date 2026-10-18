// The soundtrack of both videos, composed and synthesised here (no samples, no licences): warm chill house /
// soft nu-disco at the BPM of src/theme/timing.ts — FM Rhodes chords, a round plucked bass, a four-on-the-floor
// kit with claps, hats and a shaker, a plucked marimba-like hook, pads and a riser. Brief 9.1.
//
//   npm run music   → public/audio/music.wav (48 kHz, 16-bit, ≈ −14 LUFS before the SFX)
//
// The source is 24 bars in sections; src/audio/music-edit.ts cuts each video from it on bar lines:
//   0–1 intro (filtered) · 2–7 verse · 8–11 chorus · 12–15 break (no kick) · 16–17 build · 18–21 final chorus · 22–23 tail

import fs from "node:fs";
import path from "node:path";
import { bus, dbGain, env, filter, filterBus, limit, lufs, midiHz, mixInto, noise, pingPong, pluck, put, RATE, reverb, rng, shape, truePeak, writeWav } from "./audio/dsp.mjs";

const root = path.resolve(import.meta.dirname, "..");
const BPM = Number(fs.readFileSync(path.join(root, "src/theme/timing.ts"), "utf8").match(/BPM = (\d+(?:\.\d+)?)/)[1]);
const BEAT = 60 / BPM;
const BAR = 4 * BEAT;
const S16 = BEAT / 4;
/** Swing of the off 16ths (share of a 16th they are late by). */
const SWING = 0.12;
const at16 = (bar, i) => bar * BAR + i * S16 + (i % 2 ? SWING * S16 : 0);

/* ── Song ────────────────────────────────────────────────────────────────────────────────────────────────── */

// Rootless voicings around middle C and the bass root (MIDI).
const CHORDS = {
  Dm9: { keys: [53, 57, 60, 64], root: 38 },
  G13: { keys: [53, 59, 64, 69], root: 43 },
  Cmaj9: { keys: [52, 55, 59, 62], root: 36 },
  Am9: { keys: [55, 59, 60, 64], root: 33 },
};

// The hook: one bar per chord (16th, MIDI, length in 16ths).
const HOOK = {
  Dm9: [[0, 69, 2], [3, 72, 2], [6, 74, 3], [10, 72, 2], [12, 69, 3]],
  G13: [[0, 71, 2], [3, 74, 2], [6, 76, 3], [10, 74, 2], [12, 71, 3]],
  Cmaj9: [[0, 72, 2], [3, 76, 2], [6, 79, 3], [10, 76, 2], [12, 74, 4]],
  Am9: [[0, 72, 2], [3, 71, 2], [6, 69, 4], [12, 67, 2], [14, 69, 2]],
};

const SECTIONS = [
  { name: "intro", bars: ["Cmaj9", "Am9"] },
  { name: "verse", bars: ["Dm9", "G13", "Cmaj9", "Am9", "Dm9", "G13"] },
  { name: "chorus", bars: ["Dm9", "G13", "Cmaj9", "Am9"] },
  { name: "break", bars: ["Dm9", "G13", "Cmaj9", "Am9"] },
  { name: "build", bars: ["Dm9", "G13"] },
  { name: "final", bars: ["Dm9", "G13", "Cmaj9", "Am9"] },
  { name: "tail", bars: ["Cmaj9", "Am9"] },
];

const SONG = SECTIONS.flatMap((s) => s.bars.map((chord, i) => ({ section: s.name, chord, i, of: s.bars.length })));
const LENGTH = SONG.length * BAR + 3;

const rand = rng(2026);

/* ── Instruments ─────────────────────────────────────────────────────────────────────────────────────────── */

/** FM electric piano: a tine pair (ratio 1) with a decaying index, a bell transient (ratio 7), amp decay. */
function rhodes(m, seconds, vel = 0.8) {
  const f = midiHz(m);
  const n = Math.ceil((seconds + 0.6) * RATE);
  const out = new Float32Array(n);
  const hold = seconds;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const index = (0.4 + 2.2 * vel) * Math.exp(-t / 0.35) + 0.35;
    const mod = Math.sin(2 * Math.PI * f * t) * index;
    let v = Math.sin(2 * Math.PI * f * t + mod) + 0.12 * vel * Math.sin(2 * Math.PI * f * 7.02 * t) * Math.exp(-t / 0.025);
    const amp = Math.min(1, t / 0.003) * Math.exp(-t / (1.6 - (m - 48) * 0.015)) * (t > hold ? Math.exp(-(t - hold) / 0.12) : 1);
    out[i] = v * amp * vel;
  }
  return out;
}

/** Bass: a sine with a little 2nd/3rd harmonic, plucked, warm (lowpassed and gently saturated). */
function bass(m, seconds, vel = 1) {
  const f = midiHz(m);
  const n = Math.ceil((seconds + 0.08) * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const ph = 2 * Math.PI * f * t;
    const v = Math.sin(ph) + 0.28 * Math.sin(2 * ph) * Math.exp(-t / 0.15) + 0.1 * Math.sin(3 * ph) * Math.exp(-t / 0.08);
    const amp = Math.min(1, t / 0.004) * (0.55 + 0.45 * Math.exp(-t / 0.18)) * (t > seconds ? Math.exp(-(t - seconds) / 0.03) : 1);
    out[i] = Math.tanh(1.4 * v * amp) * vel;
  }
  return filter(out, "lp", 1100, 0.8);
}

function kick() {
  const n = Math.ceil(0.5 * RATE);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = 46 + 120 * Math.exp(-t / 0.03);
    ph += (2 * Math.PI * f) / RATE;
    out[i] = Math.sin(ph) * Math.exp(-t / 0.26) + (rand() * 2 - 1) * 0.25 * Math.exp(-t / 0.0025);
  }
  return out.map((v) => Math.tanh(1.3 * v));
}

function clap() {
  const n = Math.ceil(0.4 * RATE);
  const x = noise(n, rand);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const burst = [0, 0.011, 0.022].reduce((s, o) => s + (t >= o && t < o + 0.01 ? Math.exp(-(t - o) / 0.004) : 0), 0);
    e[i] = burst + (t >= 0.022 ? Math.exp(-(t - 0.022) / 0.11) : 0) * 0.8;
  }
  filter(x, "bp", 1300, 0.9);
  filter(x, "hp", 500);
  return x.map((v, i) => v * e[i] * 1.6);
}

function hat(open = false) {
  const n = Math.ceil((open ? 0.4 : 0.08) * RATE);
  const x = noise(n, rand);
  filter(x, "hp", 7500, 0.8);
  filter(x, "peak", 10000, 1, 4);
  const e = env(n, { attack: 0.0008, tau: open ? 0.14 : 0.022 });
  return x.map((v, i) => v * e[i]);
}

function shaker() {
  const n = Math.ceil(0.09 * RATE);
  const x = noise(n, rand);
  filter(x, "bp", 5600, 0.7);
  const e = env(n, { attack: 0.008, tau: 0.03 });
  return x.map((v, i) => v * e[i]);
}

function rim() {
  const n = Math.ceil(0.08 * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    out[i] = (Math.sin(2 * Math.PI * 1750 * t) * 0.7 + (rand() * 2 - 1) * 0.5) * Math.exp(-t / 0.012);
  }
  return filter(out, "bp", 1800, 1.2);
}

/** Marimba-ish hook: a pluck and a soft FM bell an octave up. */
function hookNote(m, seconds) {
  const f = midiHz(m);
  const n = Math.ceil((seconds + 0.8) * RATE);
  const p = pluck(f, seconds + 0.8, rand, { damp: 0.6, bright: 0.45 });
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const bell = Math.sin(2 * Math.PI * f * 2 * t + 1.2 * Math.exp(-t / 0.08) * Math.sin(2 * Math.PI * f * 7 * t)) * Math.exp(-t / 0.35);
    out[i] = p[i] * 0.8 + bell * 0.22 * Math.min(1, t / 0.002);
  }
  return filter(out, "lp", 5200);
}

/** Pad: three detuned saws per note, slow attack, lowpassed. */
function pad(notes, seconds) {
  const n = Math.ceil((seconds + 1) * RATE);
  const out = new Float32Array(n);
  for (const m of notes) {
    for (const det of [-0.09, 0, 0.11]) {
      const f = midiHz(m + det);
      let ph = rand();
      for (let i = 0; i < n; i++) {
        ph += f / RATE;
        ph -= Math.floor(ph);
        out[i] += (2 * ph - 1) * 0.08;
      }
    }
  }
  const e = env(n, { attack: 0.6, tau: 1e9, hold: seconds, release: 0.5 });
  filter(out, "lp", 1300, 0.6);
  return out.map((v, i) => v * Math.min(1, (i / RATE) / 0.6) * e[i]);
}

/** Riser: noise through a bandpass sweeping up, swelling. */
function riser(seconds) {
  const n = Math.ceil(seconds * RATE);
  const x = noise(n, rand);
  filter(x, "bp", (i) => 300 * (9000 / 300) ** ((i / n) ** 1.6), 1.4);
  return x.map((v, i) => v * ((i / n) ** 2.2) * 1.4);
}

/** Impact on a downbeat: low thump and a bright, long noise wash. */
function impact() {
  const n = Math.ceil(2.2 * RATE);
  const x = noise(n, rand);
  filter(x, "hp", 2500);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    ph += (2 * Math.PI * (40 + 60 * Math.exp(-t / 0.05))) / RATE;
    out[i] = x[i] * 0.35 * Math.exp(-t / 0.7) + Math.sin(ph) * Math.exp(-t / 0.35) * 0.8;
  }
  return out;
}

/* ── Arrangement ─────────────────────────────────────────────────────────────────────────────────────────── */

const drums = bus(LENGTH);
const bassBus = bus(LENGTH);
const keys = bus(LENGTH);
const hook = bus(LENGTH);
const pads = bus(LENGTH);
const fx = bus(LENGTH);
const kicks = [];

const K = kick();
const C = clap();
const CH = hat();
const OH = hat(true);
const SH = shaker();
const RM = rim();

SONG.forEach((b, bar) => {
  const c = CHORDS[b.chord];
  const s = b.section;
  const full = s === "chorus" || s === "final";
  const lastOf = b.i === b.of - 1;

  // Kick: four on the floor in verse and choruses; on the build's first bar too; a gap before the drop.
  if (s === "verse" || full || (s === "build" && b.i === 0)) {
    for (const q of [0, 4, 8, 12]) {
      if (s === "verse" && lastOf && q === 12 && SONG[bar + 1]?.section !== "verse") continue;
      put(drums, at16(bar, q), K, 0.95);
      kicks.push(at16(bar, q));
    }
  }
  // Claps on 2 and 4.
  if (s === "verse" || full) for (const q of [4, 12]) put(drums, at16(bar, q), C, full ? 0.42 : 0.32, 0.05);
  // Hats: 16ths with accents; open hats on the offbeats in the choruses.
  if (s !== "intro" && s !== "tail") {
    for (let q = 0; q < 16; q++) {
      if (s === "break" && q % 2) continue;
      if (s === "verse" && q % 2) continue;
      const v = q % 4 === 2 ? 0.32 : q % 2 ? 0.16 : 0.1;
      put(drums, at16(bar, q), CH, v * (s === "break" ? 0.6 : 1), 0.3);
    }
  }
  if (full) for (const q of [2, 6, 10, 14]) put(drums, at16(bar, q), OH, 0.16, -0.25);
  // Shaker all through (except the tail's last bar), rims in the choruses.
  if (!(s === "tail" && lastOf)) for (let q = 0; q < 16; q++) put(drums, at16(bar, q), SH, (q % 2 ? 0.2 : 0.11) * (s === "intro" ? 0.7 : 1), -0.35);
  if (full) for (const q of [3, 7, 10]) put(drums, at16(bar, q), RM, 0.13, 0.4);
  // Build: a snare roll that tightens and grows, and a riser into the final chorus.
  if (s === "build") {
    const steps = b.i === 0 ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    steps.forEach((q) => put(drums, at16(bar, q), C, 0.12 + 0.3 * ((b.i * 16 + q) / 32), 0));
    if (b.i === 0) put(fx, bar * BAR, riser(2 * BAR - S16 * 2), 0.5);
  }
  if (s === "final" && b.i === 0) put(fx, bar * BAR, impact(), 0.55);
  if (s === "chorus" && b.i === 0) put(fx, bar * BAR, impact(), 0.35);

  // Bass: the groove in verse and choruses, long roots in the break and the tail, a pedal in the build.
  const r = c.root;
  if (s === "verse" || full) {
    const groove = [[0, 0, 3], [3, 0, 1], [6, 12, 1], [8, 0, 2], [10, 7, 1], [11, 0, 1], [14, 12, 1]];
    for (const [q, iv, len] of groove) put(bassBus, at16(bar, q), bass(r + iv, len * S16 * 0.9, q === 0 ? 1 : 0.8), 0.62);
  } else if (s === "build") {
    for (let q = 0; q < 16; q += 2) put(bassBus, at16(bar, q), bass(r, S16 * 1.6, 0.75), 0.55);
  } else if (s !== "intro") {
    put(bassBus, bar * BAR, bass(r, BAR * 0.95, 0.9), 0.55);
  }

  // Keys: a held chord in the intro / break / tail, syncopated stabs in the verse, offbeat stabs in the choruses.
  // The intro sits behind its lowpass, so it is played louder to land near the verse.
  const keysGain = s === "intro" ? 0.42 : 0.2;
  const chord = (t, len, vel) => c.keys.forEach((m, k) => put(keys, t + k * 0.004, rhodes(m, len, vel), keysGain, -0.3 + k * 0.2));
  if (s === "intro" || s === "break" || s === "tail") chord(bar * BAR, BAR * 0.96, 0.6);
  else if (s === "verse" || s === "build") {
    for (const [q, len, v] of [[0, 3, 0.75], [6, 2, 0.6], [10, 1.5, 0.55], [14, 1, 0.5]]) chord(at16(bar, q), len * S16, v);
  } else for (const [q, len, v] of [[0, 2, 0.8], [2, 1, 0.55], [6, 1, 0.6], [10, 1, 0.6], [14, 1.5, 0.55]]) chord(at16(bar, q), len * S16, v);

  // Pads under the calm parts and the choruses.
  if (s !== "verse") put(pads, bar * BAR, pad(c.keys.map((m) => m + 12), BAR), s === "intro" ? 0.9 : s === "break" || s === "tail" ? 0.55 : 0.32);

  // Hook in the choruses; in the break it plays as a sparse arpeggio.
  if (full) for (const [q, m, len] of HOOK[b.chord]) put(hook, at16(bar, q), hookNote(m, len * S16), 0.33, 0.1);
  if (s === "break") c.keys.forEach((m, k) => put(hook, at16(bar, k * 4 + 2), hookNote(m + 12, S16 * 2), 0.2, k % 2 ? 0.4 : -0.4));
});

/* ── Mix ─────────────────────────────────────────────────────────────────────────────────────────────────── */

// Intro through a lowpass that opens; everything melodic breathes with the kick (sidechain).
const introEnd = 2 * BAR;
const sweep = (i) => {
  const t = i / RATE;
  return t < introEnd ? 900 * (12000 / 900) ** ((t / introEnd) ** 2) : 18000;
};
for (const b of [keys, pads, drums]) {
  filter(b.L, "lp", sweep, 0.7);
  filter(b.R, "lp", sweep, 0.7);
}
kicks.sort((a, b) => a - b);
/** Sidechain gain: dips by `depth` on every kick and recovers. */
const duck = (depth) => {
  const g = new Float32Array(Math.ceil(LENGTH * RATE)).fill(1);
  for (const k of kicks) {
    const s0 = Math.round(k * RATE);
    for (let i = 0; i < 0.3 * RATE && s0 + i < g.length; i++) g[s0 + i] = Math.min(g[s0 + i], 1 - depth * Math.exp(-i / RATE / 0.09));
  }
  return (t) => g[Math.min(g.length - 1, Math.round(t * RATE))];
};
shape(keys, duck(0.35));
shape(pads, duck(0.5));
shape(bassBus, duck(0.55));
shape(hook, duck(0.2));

// Tone: a little air on the keys, the bass kept out of the kick's lowest octave.
filterBus(keys, "highshelf", 6000, 0.7, 2);
filterBus(keys, "hp", 120);
filterBus(pads, "hp", 200);
filterBus(bassBus, "hp", 34);

const master = bus(LENGTH);
mixInto(master, drums, 1);
mixInto(master, bassBus, 0.8); // −2 dB: the owner asked for a little less bass (19.10)
mixInto(master, keys, 1);
mixInto(master, hook, 1);
mixInto(master, pads, 0.8);
mixInto(master, fx, 1);
// And a touch less low end overall (the kick's thump).
filterBus(master, "lowshelf", 110, 0.7, -1.5);

// Space: one room for keys, hook, claps and pads; a dotted-eighth echo on the hook.
const send = bus(LENGTH);
mixInto(send, keys, 0.5);
mixInto(send, hook, 0.7);
mixInto(send, pads, 0.6);
mixInto(send, fx, 0.4);
const claps = bus(LENGTH);
mixInto(claps, drums, 0.25);
mixInto(send, claps, 1);
mixInto(master, reverb(send, { room: 0.84, damp: 0.4 }), 0.55);
mixInto(master, pingPong(hook, BEAT * 0.75, 0.38), 0.32);

// Glue: gentle saturation, then loudness to −14 LUFS with peaks under −1 dBTP.
for (const x of [master.L, master.R]) for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * 1.1) / 1.1;
const target = -14;
for (let pass = 0; pass < 3; pass++) {
  const g = dbGain(target - lufs(master));
  shape(master, () => g);
  limit(master, -1.3);
}
// The tail fades over the last 3 seconds of the file (past the source's last bar).
const fadeFrom = SONG.length * BAR;
shape(master, (t) => (t < fadeFrom ? 1 : Math.max(0, 1 - (t - fadeFrom) / 3)));

const file = path.join(root, "public/audio/music.wav");
writeWav(file, master);
console.log(`music.wav: ${SONG.length} bars at ${BPM} BPM, ${(master.L.length / RATE).toFixed(1)} s, ${lufs(master).toFixed(1)} LUFS, ${truePeak(master).toFixed(1)} dBTP`);
