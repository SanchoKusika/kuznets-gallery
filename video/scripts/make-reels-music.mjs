// Music of the two short reels, composed and synthesised here like the main track (no samples, no licences),
// 120 BPM, 15 s each, cut to their scenes beat by beat:
//
//   npm run music:reels   → public/audio/ad.wav, public/audio/showreel.wav (48 kHz, 16-bit, ≈ −14 LUFS)
//
// Ad — bright house in C: Fmaj7 · G6 · Em7 · Am9 · Fmaj7 · G6 | Cmaj9 on the logo. A breakdown with a riser under the
// custom work (beats 16–19), the drop on the montage (19), the final hit on the logo (24).
// Showreel — harder, darker: Am9 · Fmaj7 · Cmaj9 · G6 · Am9 · Fmaj7 · G6 | Cmaj9; every chapter changes the groove
// (pulse, drive, breakbeat, half-time, full drive, gated stutter), the final hit on the logo (25).
// Scene starts in beats are those of src/ad/layout.ts and src/showreel/layout.ts.

import path from "node:path";
import { bus, dbGain, env, filter, filterBus, limit, lufs, midiHz, mixInto, pingPong, put, RATE, reverb, rng, shape, truePeak, writeWav } from "./audio/dsp.mjs";
import { instruments } from "./audio/instruments.mjs";

const root = path.resolve(import.meta.dirname, "..");
const BPM = 120;
const BEAT = 60 / BPM;
const S16 = BEAT / 4;
const LENGTH = 15;
/** Seconds at beat b (fractions allowed). */
const at = (b) => b * BEAT;

const CH = {
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

function makeTrack(name, seed, arrange) {
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
  console.log(`${name}.wav: ${LENGTH} s at ${BPM} BPM, ${lufs(out).toFixed(1)} LUFS, ${truePeak(out).toFixed(1)} dBTP`);
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

/* ── Ad ─────────────────────────────────────────────────────────────────────────────────────────────────── */

makeTrack("ad", 120, (B) => {
  const k = kit(B);
  const bars = ["Fmaj7", "G6", "Em7", "Am9", "Fmaj7", "G6"];
  // Drums: four on the floor except the breakdown (16–19); claps on 2 and 4; 16th hats, open hats once it is full.
  for (let beat = 0; beat < 24; beat++) {
    const down = beat >= 16 && beat < 19;
    if (!down) k.kick(beat);
    if (!down && beat % 2 === 1) k.clap(beat, beat >= 4 ? 0.42 : 0.34);
    for (let q = 0; q < 4; q++) {
      if (down && q % 2) continue;
      k.hat(beat + q / 4, (q === 2 ? 0.26 : q % 2 ? 0.13 : 0.08) * (down ? 0.6 : 1));
      k.shaker(beat + q / 4, q % 2 ? 0.14 : 0.08);
    }
    if (!down && beat >= 4) k.open(beat + 0.5);
  }
  // The montage's eighth cuts: a clap roll into the logo.
  for (const q of [22.5, 23, 23.25, 23.5, 23.75]) k.clap(q, 0.22 + 0.25 * (q - 22.5));
  bars.forEach((c, bar) => {
    const b0 = bar * 4;
    const r = CH[c].root;
    // Bass groove, long notes in the breakdown.
    if (bar === 4) k.bass(r, b0, 3 * BEAT, 0.85, 0.5);
    else for (const [q, iv, len] of GROOVE) k.bass(r + iv, b0 + q / 4, len * S16 * 0.9, q === 0 ? 1 : 0.8);
    // Keys: the first bar opens as a held chord, then off-beat stabs; held again in the breakdown.
    if (bar === 0 || bar === 4) k.chord(c, b0, 4 * BEAT * 0.95, 0.6, 0.32);
    else for (const [q, len, v] of [[0, 2, 0.8], [2, 1, 0.55], [6, 1, 0.6], [10, 1, 0.6], [14, 1.5, 0.55]]) k.chord(c, b0 + q / 4, len * S16, v);
    // Hook over the wall, the rooms and the montage.
    if (bar === 1 || bar === 2 || bar === 5) for (const [q, m, len] of HOOK[c]) k.hookNote(m, b0 + q / 4, len * S16, 0.32);
    if (bar === 4) k.pad(c, b0, 3 * BEAT, 0.6);
  });
  // The montage starts on beat 19 with the groove of bar 5 pulled forward by one beat.
  k.bass(CH.Fmaj7.root, 19, BEAT * 0.9);
  k.chord("G6", 19, S16 * 2, 0.8);
  // The first bar's filter opens over the first beat (the dot lands on beat 1).
  shape(B.keys, (t) => (t < at(1) ? 0.35 + 0.65 * (t / at(1)) : 1));
  k.riser(16, 3 * BEAT - S16, 0.55);
  k.impact(19, 0.4);
  // The logo: the hit, Cmaj9 ringing, the beads as a rising arpeggio.
  k.impact(24, 0.6);
  k.kick(24, 1);
  k.bass(CH.Cmaj9.root, 24, 4 * BEAT, 1, 0.6);
  k.chord("Cmaj9", 24, 5 * BEAT, 0.75, 0.3);
  k.pad("Cmaj9", 24, 5 * BEAT, 0.55);
  [76, 79, 83, 86].forEach((m, i) => k.hookNote(m, 24.5 + i * 0.5, S16 * 3, 0.24, i % 2 ? 0.4 : -0.4));
  k.hookNote(84, 26, BEAT * 2, 0.26);
});

/* ── Showreel ───────────────────────────────────────────────────────────────────────────────────────────── */

makeTrack("showreel", 26, (B) => {
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
