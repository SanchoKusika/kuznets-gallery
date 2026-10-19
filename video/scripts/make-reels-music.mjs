// Music of the short reels, composed and synthesised here like the main track (no samples, no licences), 120 BPM,
// cut to their scenes beat by beat:
//
//   npm run music:reels   → public/audio/room.wav (17 s), showreel.wav (15 s), kinetic.wav (25.2 s, 100 BPM) (48 kHz, 16-bit, ≈ −14 LUFS)
//
// Room — a waltz-time bar (3 beats) per room, each with its own sound world: a clock in the dull intro, then the drop
// on the first painting; marimba and shakers (jungle), rain (London), everything under water with a semitone
// shark bass, no drums and a theremin (space), a frame drum and a plucked line in Phrygian dominant (desert), a
// whistle (sky), cosy keys (tea); stabs on the montage, the hook on the choice, the final chord on the logo.
// Showreel — harder, darker: Am9 · Fmaj7 · Cmaj9 · G6 · Am9 · Fmaj7 · G6 | Cmaj9; every chapter changes the groove
// (pulse, drive, breakbeat, half-time, full drive, gated stutter), the final hit on the logo (25).
// Kinetic «Кто ты?» — 100 BPM: a quiet motif on the wall, silence on «молчит», a growing pulse, the hit on «КАРТИНА»,
// a heartbeat under «кто ты?», the drop on «смелый», no drums on «спокойный», an arpeggio for «мечтатель», the logo.
// Scene starts in beats are those of src/room/layout.ts, src/showreel/layout.ts and src/kinetic/kit.tsx.

import path from "node:path";
import { bus, dbGain, env, filter, filterBus, limit, lufs, midiHz, mixInto, pingPong, put, RATE, reverb, rng, shape, truePeak, writeWav } from "./audio/dsp.mjs";
import { instruments } from "./audio/instruments.mjs";

const root = path.resolve(import.meta.dirname, "..");
const BPM = 120;
const BEAT = 60 / BPM;
const S16 = BEAT / 4;
/** Seconds at beat b (fractions allowed). */
const at = (b) => b * BEAT;

const CH = {
  E7b9: { keys: [52, 56, 59, 62, 65], root: 40 },
  Fmaj7: { keys: [53, 57, 60, 64], root: 41 },
  G6: { keys: [55, 59, 62, 64], root: 43 },
  Em7: { keys: [52, 55, 59, 62], root: 40 },
  Am9: { keys: [55, 59, 60, 64], root: 45 },
  Cmaj9: { keys: [52, 55, 59, 62], root: 36 },
};
/** Hook phrases per chord: [16th in the bar, MIDI, length in 16ths]. */
const HOOK = {
  Fmaj7: [[0, 72, 2], [3, 76, 1], [6, 77, 2], [10, 76, 2], [12, 72, 3]],
  G6: [[0, 74, 2], [3, 79, 1], [6, 76, 2], [10, 74, 2], [12, 71, 3]],
  Em7: [[0, 71, 2], [3, 74, 1], [6, 76, 3], [10, 79, 2], [12, 76, 3]],
  Am9: [[0, 72, 2], [3, 76, 1], [6, 79, 2], [8, 81, 2], [12, 79, 2], [14, 76, 2]],
  Cmaj9: [[0, 79, 2], [3, 76, 2], [6, 74, 2], [10, 72, 4]],
};

/** Saw stab: three detuned saws through a closing lowpass, short. */
function sawStab(notes, seconds, rand, bright = 1) {
  const n = Math.ceil((seconds + 0.25) * RATE);
  const out = new Float32Array(n);
  for (const m of notes)
    for (const det of [-0.12, 0, 0.13]) {
      const f = midiHz(m + det);
      let ph = rand();
      for (let i = 0; i < n; i++) {
        ph += f / RATE;
        ph -= Math.floor(ph);
        out[i] += (2 * ph - 1) * 0.12;
      }
    }
  const e = env(n, { attack: 0.002, tau: 1e9, hold: seconds, release: 0.06 });
  filter(out, "lp", (i) => 400 + 5200 * bright * Math.exp(-i / RATE / 0.09), 1.1);
  return out.map((v, i) => v * e[i]);
}

/** Sub: a clean sine with a click of attack. */
function sub(m, seconds) {
  const f = midiHz(m);
  const n = Math.ceil((seconds + 0.05) * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    out[i] = Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.003) * (t > seconds ? Math.exp(-(t - seconds) / 0.02) : 1);
  }
  return out;
}

/** Renders one track of `LENGTH` s; `post(master)` may process the full mix before the master (the underwater filter). */
function makeTrack(name, seed, LENGTH, arrange, post) {
  const rand = rng(seed);
  const ins = instruments(rand);
  const b = { drums: bus(LENGTH + 2), bass: bus(LENGTH + 2), keys: bus(LENGTH + 2), hook: bus(LENGTH + 2), pads: bus(LENGTH + 2), fx: bus(LENGTH + 2), kicks: [] };
  arrange({ ...b, ins, rand });

  // Sidechain from the kicks.
  b.kicks.sort((x, y) => x - y);
  const duck = (depth) => {
    const g = new Float32Array(Math.ceil((LENGTH + 2) * RATE)).fill(1);
    for (const k of b.kicks) {
      const s0 = Math.round(k * RATE);
      for (let i = 0; i < 0.25 * RATE && s0 + i < g.length; i++) g[s0 + i] = Math.min(g[s0 + i], 1 - depth * Math.exp(-i / RATE / 0.08));
    }
    return (t) => g[Math.min(g.length - 1, Math.round(t * RATE))];
  };
  shape(b.keys, duck(0.4));
  shape(b.pads, duck(0.55));
  shape(b.bass, duck(0.5));
  shape(b.hook, duck(0.2));
  filterBus(b.keys, "highshelf", 6000, 0.7, 2);
  filterBus(b.keys, "hp", 140);
  filterBus(b.pads, "hp", 220);
  filterBus(b.bass, "hp", 34);

  const master = bus(LENGTH + 2);
  mixInto(master, b.drums, 1);
  mixInto(master, b.bass, 0.8);
  mixInto(master, b.keys, 1);
  mixInto(master, b.hook, 1);
  mixInto(master, b.pads, 0.8);
  mixInto(master, b.fx, 1);
  filterBus(master, "lowshelf", 110, 0.7, -1.5);
  const send = bus(LENGTH + 2);
  mixInto(send, b.keys, 0.5);
  mixInto(send, b.hook, 0.7);
  mixInto(send, b.pads, 0.6);
  mixInto(send, b.fx, 0.4);
  mixInto(master, reverb(send, { room: 0.82, damp: 0.4 }), 0.5);
  mixInto(master, pingPong(b.hook, BEAT * 0.75, 0.35), 0.3);
  post?.(master);
  for (const x of [master.L, master.R]) for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * 1.1) / 1.1;
  // Exactly the video's length; the last chord rings out under a short fade.
  const out = { L: master.L.slice(0, LENGTH * RATE), R: master.R.slice(0, LENGTH * RATE) };
  shape(out, (t) => Math.min(1, (LENGTH - t) / 0.5));
  for (let pass = 0; pass < 3; pass++) {
    const g = dbGain(-14 - lufs(out));
    shape(out, () => g);
    limit(out, -1.3);
  }
  writeWav(path.join(root, "public/audio", `${name}.wav`), out);
  console.log(`${name}.wav: ${LENGTH} s, ${lufs(out).toFixed(1)} LUFS, ${truePeak(out).toFixed(1)} dBTP`);
}

/** Helpers bound to one track's buses. */
function kit(B) {
  const { ins } = B;
  const K = ins.kick();
  const C = ins.clap();
  const CH_ = ins.hat();
  const OH = ins.hat(true);
  const SH = ins.shaker();
  return {
    kick: (beat, g = 0.95) => {
      put(B.drums, at(beat), K, g);
      B.kicks.push(at(beat));
    },
    clap: (beat, g = 0.42) => put(B.drums, at(beat), C, g, 0.05),
    hat: (beat, g = 0.18) => put(B.drums, at(beat), CH_, g, 0.3),
    open: (beat, g = 0.15) => put(B.drums, at(beat), OH, g, -0.25),
    shaker: (beat, g = 0.12) => put(B.drums, at(beat), SH, g, -0.35),
    chord: (c, beat, len, vel = 0.7, gain = 0.2) => CH[c].keys.forEach((m, k) => put(B.keys, at(beat) + k * 0.004, ins.rhodes(m, len, vel), gain, -0.3 + k * 0.2)),
    bass: (m, beat, len, vel = 0.9, gain = 0.6) => put(B.bass, at(beat), ins.bass(m, len, vel), gain),
    hookNote: (m, beat, len, gain = 0.3, pan = 0.1) => put(B.hook, at(beat), ins.hookNote(m, len), gain, pan),
    pad: (c, beat, len, gain = 0.4) => put(B.pads, at(beat), ins.pad(CH[c].keys.map((m) => m + 12), len), gain),
    riser: (beat, len, gain = 0.5) => put(B.fx, at(beat), ins.riser(len), gain),
    impact: (beat, gain = 0.5) => put(B.fx, at(beat), ins.impact(), gain),
  };
}

const GROOVE = [[0, 0, 3], [3, 0, 1], [6, 12, 1], [8, 0, 2], [10, 7, 1], [11, 0, 1], [14, 12, 1]];

/* ── Showreel ───────────────────────────────────────────────────────────────────────────────────────────── */

makeTrack("showreel", 26, 15, (B) => {
  const k = kit(B);
  const { rand } = B;
  const bars = ["Am9", "Fmaj7", "Cmaj9", "G6", "Am9", "Fmaj7", "G6"];
  const chordAt = (beat) => bars[Math.min(bars.length - 1, Math.floor(beat / 4))];
  const stab = (beat, len, gain = 0.2, bright = 1) => put(B.keys, at(beat), sawStab(CH[chordAt(beat)].keys.map((m) => m + 12), len, rand, bright), gain, 0);

  // S1 (0–2): a sub pulse on the beats, ticking sixteenths, a riser into the yellow.
  for (const beat of [0, 1]) put(B.bass, at(beat), sub(33, BEAT * 0.8), 0.7);
  for (let q = 0; q < 8; q++) k.hat(q / 4, 0.1 + 0.02 * q);
  k.riser(0.5, 1.5 * BEAT, 0.45);
  k.impact(2, 0.55);

  for (let beat = 2; beat < 25; beat++) {
    const chap = beat < 5 ? "type" : beat < 9 ? "shapes" : beat < 13 ? "slices" : beat < 17 ? "ring" : beat < 21 ? "wall" : "words";
    const r = CH[chordAt(beat)].root;
    if (chap === "slices") {
      // Breakbeat.
      if (beat % 4 === 1) [0, 0.75].forEach((o) => k.kick(beat + o));
      if (beat % 4 === 3) [0, 0.5].forEach((o) => k.kick(beat + o));
      if (beat % 2 === 0) k.clap(beat, 0.44);
      for (let q = 0; q < 4; q++) k.hat(beat + q / 4, q % 2 ? 0.16 : 0.24);
      k.bass(r, beat, BEAT * 0.4);
      k.bass(r + 12, beat + 0.75, S16 * 0.9, 0.7);
    } else if (chap === "ring") {
      // Half-time: kick on 1 and the "and" of 3, a big clap on 3, a wide pad.
      if ((beat - 13) % 4 === 0) k.kick(beat);
      if ((beat - 13) % 4 === 2) {
        k.clap(beat, 0.55);
        k.kick(beat + 0.5);
      }
      for (let q = 0; q < 2; q++) k.hat(beat + q / 2, 0.14);
      if ((beat - 13) % 2 === 0) k.bass(r, beat, BEAT * 1.8, 0.9, 0.55);
      if (beat === 13) k.pad(chordAt(13), 13, 4 * BEAT, 0.65);
      if ((beat - 13) % 2 === 1) k.hookNote(CH[chordAt(beat)].keys[3] + 12, beat + 0.5, S16 * 3, 0.24, (beat % 4) - 1.5);
    } else {
      // Four on the floor.
      k.kick(beat);
      if (beat % 2 === 1 || chap === "words") k.clap(beat, chap === "words" ? 0.32 : 0.42);
      for (let q = 0; q < 4; q++) k.hat(beat + q / 4, q === 2 ? 0.26 : q % 2 ? 0.13 : 0.09);
      if (chap !== "type") k.open(beat + 0.5, 0.13);
      // Bass: pumping eighths, sixteenths in the wall.
      const step = chap === "wall" ? 0.25 : 0.5;
      for (let o = 0; o < 1; o += step) k.bass(r + (o === 0.5 ? 12 : 0), beat + o, step * BEAT * 0.85, o === 0 ? 1 : 0.75, 0.55);
      if (chap === "type" || chap === "shapes") stab(beat + 0.5, S16 * 1.2, 0.22);
      if (chap === "shapes") {
        const c = chordAt(beat);
        HOOK[c].filter(([q]) => q >= ((beat % 4) * 4) && q < ((beat % 4) * 4 + 4)).forEach(([q, m, len]) => k.hookNote(m, Math.floor(beat / 4) * 4 + q / 4, len * S16, 0.3));
      }
      // Kinetic type: a gated chord on every eighth.
      if (chap === "words") for (const o of [0, 0.5]) stab(beat + o, S16 * 0.9, 0.26, 1.3);
    }
    // A thud on every chapter change.
    if ([5, 9, 13, 17, 21].includes(beat)) k.impact(beat, 0.38);
  }
  k.riser(19, 2 * BEAT - S16, 0.5);
  k.riser(23, 2 * BEAT - S16, 0.45);
  // The end: the hit on 25, Cmaj9 ringing, the beads and the dot as notes.
  k.impact(25, 0.65);
  k.kick(25, 1);
  put(B.bass, at(25), sub(36, 3 * BEAT), 0.7);
  k.chord("Cmaj9", 25, 4 * BEAT, 0.75, 0.3);
  put(B.keys, at(25), sawStab(CH.Cmaj9.keys.map((m) => m + 12), 2 * BEAT, rand, 0.6), 0.16, 0);
  k.pad("Cmaj9", 25, 4 * BEAT, 0.6);
  [79, 83, 86].forEach((m, i) => k.hookNote(m, 25.25 + i * 0.25, S16 * 3, 0.22, i - 1));
  k.hookNote(88, 26.25, BEAT * 2, 0.24);
});

/* ── Room ───────────────────────────────────────────────────────────────────────────────────────────────── */

/** A sine with vibrato gliding between notes (theremin, whistle): [beat, midi] points, held to `end`. */
function glideVoice(points, end, vib = 0.25, bright = 0) {
  const n = Math.ceil(at(end - points[0][0]) * RATE);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const b = points[0][0] + i / RATE / BEAT;
    let m = points[0][1];
    for (let k = 0; k < points.length - 1; k++) {
      const [b0, m0] = points[k];
      const [b1, m1] = points[k + 1];
      if (b >= b0) m = b < b1 ? m0 + (m1 - m0) * Math.min(1, ((b - b0) / Math.min(0.35, b1 - b0)) ** 0.7) : m1;
    }
    const f = midiHz(m + vib * Math.sin(2 * Math.PI * 5.5 * (i / RATE)));
    ph += (2 * Math.PI * f) / RATE;
    const t = i / RATE;
    const e = Math.min(1, t / 0.06) * Math.min(1, (n - i) / RATE / 0.2);
    out[i] = (Math.sin(ph) + bright * 0.25 * Math.sin(2 * ph)) * e;
  }
  return out;
}

makeTrack(
  "room",
  73,
  17,
  (B) => {
    const k = kit(B);
    const { ins, rand } = B;
    /** One room: a bar of three beats (waltz time, so every room is one bar). */
    const bar = (b0, chord, opts = {}) => {
      const { kick = true, clap = true, hats = true, shaker = false, bass = true, keys = "stabs" } = opts;
      const c = CH[chord];
      if (kick) [0, 1.5].forEach((o) => k.kick(b0 + o, o ? 0.75 : 0.95));
      if (clap) k.clap(b0 + 2, 0.4);
      if (hats) for (let q = 0; q < 6; q++) k.hat(b0 + q / 2, q % 2 ? 0.2 : 0.1);
      if (shaker) for (let q = 0; q < 12; q++) k.shaker(b0 + q / 4, q % 2 ? 0.2 : 0.1);
      if (bass) [[0, 0, 1.2], [1.5, 7, 0.6], [2.5, 12, 0.4]].forEach(([o, iv, len]) => k.bass(c.root + iv, b0 + o, len * BEAT, o ? 0.8 : 1));
      if (keys === "stabs") [[0.5, 0.4], [1, 0.3], [2.5, 0.4]].forEach(([o, len]) => k.chord(chord, b0 + o, len * BEAT, 0.65));
      if (keys === "hold") k.chord(chord, b0, 2.9 * BEAT, 0.6, 0.28);
    };
    // Intro: only a low, tired chord under the clock.
    k.pad("Cmaj9", 0, 2.4 * BEAT, 0.25);
    k.riser(2.2, 0.8 * BEAT, 0.35);
    // 1 Jungle — the drop: marimba arpeggio, loud shakers, birds (SFX).
    k.impact(3, 0.45);
    bar(3, "Cmaj9", { shaker: true });
    [72, 76, 79, 83, 84, 83, 79, 76].forEach((m, i) => k.hookNote(m, 3 + i * 0.375, S16 * 1.5, 0.3, i % 2 ? 0.3 : -0.3));
    // 2 Rain — kick on one only, no hats (the rain is the hats).
    bar(6, "Am9", { hats: false, keys: "hold" });
    const rainLen = Math.ceil(at(3) * RATE);
    const rainBed = Float32Array.from({ length: rainLen }, (_, i) => (rand() * 2 - 1) * Math.min(1, i / RATE / 0.1) * Math.min(1, (rainLen - i) / RATE / 0.15));
    put(B.fx, at(6), filter(rainBed, "bp", 3800, 0.5), 0.22, 0);
    // 3 Water — under water (the post filter), and the shark: semitone pulses speeding up.
    bar(9, "Fmaj7", { hats: false });
    [9.9, 10.4, 10.8, 11.1, 11.35, 11.55, 11.72, 11.86].forEach((b, i) => k.bass(i % 2 ? 41 : 40, b, 0.22 * BEAT, 1, 0.75));
    // 4 Space — no drums: a big pad and a theremin.
    k.pad("Em7", 12, 3 * BEAT, 0.7);
    put(B.hook, at(12.25), glideVoice([[12.25, 71], [12.9, 76], [13.6, 79], [14.3, 78], [14.8, 78]], 14.95, 0.35), 0.28, 0.1);
    put(B.bass, at(12), ins.bass(40, 2.9 * BEAT, 0.8), 0.45);
    // 5 Desert — a frame drum (dum on 1, teks) and a plucked line in E Phrygian dominant.
    k.impact(15, 0.3);
    [0, 1.5].forEach((o) => k.kick(15 + o, 0.8));
    [0.5, 1, 2, 2.5, 2.75].forEach((o) => put(B.drums, at(15 + o), ins.rim(), 0.35, o % 1 ? 0.3 : -0.3));
    k.bass(40, 15, 2.8 * BEAT, 0.9, 0.55);
    [[0, 64], [0.5, 65], [0.75, 68], [1, 69], [1.5, 71], [2, 72], [2.25, 71], [2.5, 68]].forEach(([o, m]) => k.hookNote(m, 15 + o, S16 * 1.6, 0.34, -0.1));
    k.chord("E7b9", 15, 0.4 * BEAT, 0.6, 0.18);
    // 6 Sky — light: kick, a whistle melody, held keys.
    bar(18, "G6", { clap: false, keys: "hold" });
    put(B.hook, at(18.25), glideVoice([[18.25, 79], [18.75, 81], [19.25, 83], [19.75, 86], [20.4, 84], [20.8, 84]], 20.95, 0.18, 0.3), 0.22, 0.25);
    // 7 Tea — cosy: held keys, a soft shaker, a long bass.
    k.chord("Cmaj9", 21, 2.9 * BEAT, 0.6, 0.3);
    for (let q = 0; q < 12; q++) k.shaker(21 + q / 4, q % 2 ? 0.12 : 0.06);
    [0, 1.5].forEach((o) => k.kick(21 + o, 0.55));
    k.bass(36, 21, 2.8 * BEAT, 0.9, 0.5);
    [76, 79, 83].forEach((m, i) => k.hookNote(m, 21.5 + i * 0.5, S16 * 2, 0.2, 0));
    // Montage — a stab on every painting, kick on every beat, a riser into the choice.
    const montage = ["Am9", "Fmaj7", "G6"];
    for (let i = 0; i < 12; i++) put(B.keys, at(24 + i / 4), sawStab(CH[montage[Math.floor(i / 4)]].keys.map((m) => m + 12), S16 * 0.8, rand, 1.2), 0.24, 0);
    montage.forEach((c, i) => {
      k.kick(24 + i);
      k.bass(CH[c].root, 24 + i, 0.9 * BEAT);
    });
    k.clap(25, 0.4);
    k.clap(26, 0.4);
    k.riser(25, 2 * BEAT - S16, 0.5);
    // Choice — the hook over Fmaj7.
    k.impact(27, 0.4);
    bar(27, "Fmaj7");
    [[0, 72], [0.5, 76], [1, 77], [1.5, 79], [2, 81], [2.5, 79]].forEach(([o, m]) => k.hookNote(m, 27 + o, S16 * 1.6, 0.3, 0.1));
    // Logo — the hit, Cmaj9 ringing, the beads and the dot as notes.
    k.impact(30, 0.6);
    k.kick(30, 1);
    k.bass(36, 30, 4 * BEAT, 1, 0.6);
    k.chord("Cmaj9", 30, 5 * BEAT, 0.75, 0.3);
    k.pad("Cmaj9", 30, 5 * BEAT, 0.55);
    [76, 79, 83].forEach((m, i) => k.hookNote(m, 30.5 + i * 0.25, S16 * 3, 0.24, i - 1));
    k.hookNote(84, 31.5, BEAT * 2, 0.26);
  },
  (master) => {
    // Under water from beat 9 to 12: the whole mix behind a lowpass that closes in and opens out.
    const cut = (i) => {
      const b = i / RATE / BEAT;
      if (b < 9 || b > 12.1) return 18000;
      const w = Math.min(Math.min(1, (b - 9) / 0.25), Math.min(1, Math.max(0, (12.1 - b) / 0.15)));
      return 18000 * (1 - w) + 650 * w;
    };
    filter(master.L, "lp", cut, 0.9);
    filter(master.R, "lp", cut, 0.9);
  },
);

/* ── Kinetic «Кто ты?» (100 BPM) ─────────────────────────────────────────────────────────────────────────── */

// This track runs at 100 BPM: its own beat helpers, the same instruments.
{
  const KB = 60 / 100;
  const kat = (b) => b * KB;
  const K16 = KB / 4;
  makeTrack(
    "kinetic",
    100,
    25.2,
    (B) => {
      const { ins, rand } = B;
      const K = ins.kick();
      const C = ins.clap();
      const H = ins.hat();
      const OH = ins.hat(true);
      const SH = ins.shaker();
      const kick = (b, g = 0.95) => {
        put(B.drums, kat(b), K, g);
        B.kicks.push(kat(b));
      };
      const clap = (b, g = 0.4) => put(B.drums, kat(b), C, g, 0.05);
      const hat = (b, g = 0.15) => put(B.drums, kat(b), H, g, 0.3);
      const open = (b, g = 0.13) => put(B.drums, kat(b), OH, g, -0.25);
      const shaker = (b, g = 0.1) => put(B.drums, kat(b), SH, g, -0.35);
      const chord = (c, b, len, vel = 0.7, gain = 0.22) => CH[c].keys.forEach((m, k) => put(B.keys, kat(b) + k * 0.004, ins.rhodes(m, len, vel), gain, -0.3 + k * 0.2));
      const bass = (m, b, len, vel = 0.9, gain = 0.6) => put(B.bass, kat(b), ins.bass(m, len, vel), gain);
      const note = (m, b, len, gain = 0.3, pan = 0.1) => put(B.hook, kat(b), ins.hookNote(m, len), gain, pan);
      const pad = (c, b, len, gain = 0.45) => put(B.pads, kat(b), ins.pad(CH[c].keys.map((m) => m + 12), len), gain);
      const bars = ["Am9", "Fmaj7", "Cmaj9", "G6", "Am9", "Fmaj7", "Cmaj9", "G6", "Am9"];
      const chordAt = (b) => bars[Math.min(bars.length - 1, Math.floor(b / 4))];
      const groove = (b0, b1, { claps = true, opens = true } = {}) => {
        for (let b = b0; b < b1; b++) {
          kick(b);
          if (claps && b % 2 === 1) clap(b);
          for (let q = 0; q < 4; q++) hat(b + q / 4, q === 2 ? 0.24 : q % 2 ? 0.12 : 0.08);
          if (opens) open(b + 0.5);
          const r = CH[chordAt(b)].root;
          bass(r, b, KB * 0.45, 1, 0.55);
          bass(r + 12, b + 0.5, KB * 0.3, 0.75, 0.45);
        }
      };

      // 0–3 «стена»: a quiet Rhodes motif over a low pad.
      // Loud enough to hook from the first frame, still far from the hit.
      pad("Am9", 0, kat(3), 0.9);
      [[0, 76], [0.75, 72], [1.5, 79], [2.25, 77]].forEach(([b, m]) => note(m, b, K16 * 3, 0.42, -0.2));
      [0, 1, 2].forEach((b) => bass(33, b, KB * 0.8, 0.7, 0.4));
      for (let q = 0; q < 12; q++) shaker(q / 4, 0.05);
      // 3–5 «молчит»: everything stops; one high note.
      note(88, 3.25, KB * 1.5, 0.14, 0.3);
      // 5–8 «пока не появится»: a pulse comes in and grows, a riser into the hit.
      for (let b = 5; b < 8; b += 0.5) bass(33, b, KB * 0.3, 0.6 + 0.12 * (b - 5), 0.5);
      for (let q = 0; q < 12; q++) hat(5 + q / 4, 0.06 + 0.012 * q);
      put(B.fx, kat(6), ins.impact(), 0.25);
      put(B.fx, kat(6.2), ins.riser(kat(1.75)), 0.5);
      // 8 «КАРТИНА»: the hit; the groove until 14.
      put(B.fx, kat(8), ins.impact(), 0.6);
      groove(8, 14);
      for (let b = 8; b < 14; b++) [[0.5, 0.35], [1.5, 0.3]].forEach(([o, len]) => b % 2 === 0 && chord(chordAt(b), b + o, KB * len, 0.65));
      // 11 «скажет»: the hook speaks.
      [[11, 72], [11.25, 76], [11.5, 79], [12, 81], [12.5, 79], [13, 76], [13.5, 79]].forEach(([b, m]) => note(m, b, K16 * 2, 0.3, 0.1));
      // 14–16 «за тебя»: half-time, a held chord.
      kick(14);
      clap(15, 0.5);
      chord("G6", 14, KB * 1.9, 0.6, 0.26);
      bass(43, 14, KB * 1.8, 0.9, 0.55);
      // 16–20 «кто ты?»: a heartbeat, a dark pad, ticks on the portrait swaps, a riser.
      pad("Am9", 16, kat(4), 0.6);
      for (let b = 16; b < 20; b++) {
        kick(b, 0.85);
        kick(b + 0.28, 0.5);
      }
      for (let b = 16.5; b < 20; b += 0.5) hat(b, 0.12);
      put(B.fx, kat(18.5), ins.riser(kat(1.5)), 0.5);
      // 20 «смелый»: the drop.
      put(B.fx, kat(20), ins.impact(), 0.65);
      groove(20, 24);
      for (let b = 20; b < 24; b++) put(B.keys, kat(b + 0.5), sawStab(CH.Fmaj7.keys.map((m) => m + 12), K16 * 1.4, rand, 1.2), 0.22, 0);
      // 24 «спокойный»: drums out, soft keys, water-like plucks.
      chord("Cmaj9", 24, KB * 3.8, 0.55, 0.28);
      pad("Cmaj9", 24, kat(4), 0.5);
      bass(36, 24, KB * 3.6, 0.8, 0.45);
      [79, 76, 83, 79, 84, 81, 79, 76].forEach((m, i) => note(m, 24.5 + i * 0.4, K16 * 3, 0.16, i % 2 ? 0.4 : -0.4));
      // 28 «мечтатель»: light kick and hats, a rising arpeggio.
      for (let b = 28; b < 32; b++) {
        kick(b, 0.7);
        for (let q = 0; q < 2; q++) hat(b + q / 2, 0.1);
      }
      chord("G6", 28, KB * 3.8, 0.55, 0.22);
      bass(43, 28, KB * 3.6, 0.8, 0.45);
      [74, 79, 83, 86, 88, 91, 93, 95].forEach((m, i) => note(m, 28.25 + i * 0.45, K16 * 2, 0.2, i % 2 ? 0.3 : -0.3));
      // 32 «159 характеров»: the full groove with the hook.
      put(B.fx, kat(32), ins.impact(), 0.5);
      groove(32, 36);
      for (let b = 32; b < 36; b++) chord("Am9", b + 0.5, KB * 0.35, 0.65);
      [[32, 76], [32.5, 79], [33, 81], [33.5, 79], [34, 84], [34.5, 83], [35, 81], [35.5, 79]].forEach(([b, m]) => note(m, b, K16 * 2, 0.28));
      // 36 «найди свою»; 38 the logo: the hit, Cmaj9 ringing, the beads and the dot as notes.
      chord("Fmaj7", 36, KB * 1.9, 0.6, 0.26);
      chord("G6", 37, KB * 0.9, 0.6, 0.26);
      kick(36);
      kick(37);
      put(B.fx, kat(38), ins.impact(), 0.6);
      kick(38, 1);
      bass(36, 38, KB * 4, 1, 0.6);
      chord("Cmaj9", 38, KB * 4.5, 0.75, 0.3);
      pad("Cmaj9", 38, kat(4.5), 0.55);
      [76, 79, 83].forEach((m, i) => note(m, 38.5 + i * 0.25, K16 * 3, 0.24, i - 1));
      note(84, 39.5, KB * 2, 0.26);
    },
  );
}
