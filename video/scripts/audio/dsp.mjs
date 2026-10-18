// Small DSP kit for the generated soundtrack (scripts/make-music.mjs, scripts/make-sfx.mjs): everything is
// synthesised here, so the music and the effects belong to the project — no samples, no licences.
// Deterministic: noise comes from a seeded generator, so every run writes the same files.

import fs from "node:fs";

export const RATE = 48000;
const TAU = Math.PI * 2;

/** Seeded PRNG (mulberry32) → [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
export const dbGain = (db) => 10 ** (db / 20);

/** A stereo bus of `seconds`. */
export const bus = (seconds) => ({ L: new Float32Array(Math.ceil(seconds * RATE)), R: new Float32Array(Math.ceil(seconds * RATE)) });

/** Mixes a mono signal into a bus at `at` seconds with gain and equal-power pan (−1 … 1). */
export function put(b, at, mono, gain = 1, pan = 0) {
  const s0 = Math.round(at * RATE);
  const a = ((pan + 1) * Math.PI) / 4;
  const gl = gain * Math.cos(a) * Math.SQRT2;
  const gr = gain * Math.sin(a) * Math.SQRT2;
  for (let i = 0; i < mono.length; i++) {
    const j = s0 + i;
    if (j < 0) continue;
    if (j >= b.L.length) break;
    b.L[j] += mono[i] * gl;
    b.R[j] += mono[i] * gr;
  }
}

/** Mixes a stereo bus into another with a gain. */
export function mixInto(dst, src, gain = 1) {
  const n = Math.min(dst.L.length, src.L.length);
  for (let i = 0; i < n; i++) {
    dst.L[i] += src.L[i] * gain;
    dst.R[i] += src.R[i] * gain;
  }
}

/* ── Filters ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** RBJ biquad coefficients. */
export function biquad(type, f, q = 0.707, gainDb = 0) {
  const w = (TAU * Math.min(f, RATE * 0.45)) / RATE;
  const cs = Math.cos(w);
  const sn = Math.sin(w);
  const al = sn / (2 * q);
  const A = 10 ** (gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lp") [b0, b1, b2, a0, a1, a2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2, 1 + al, -2 * cs, 1 - al];
  else if (type === "hp") [b0, b1, b2, a0, a1, a2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2, 1 + al, -2 * cs, 1 - al];
  else if (type === "bp") [b0, b1, b2, a0, a1, a2] = [al, 0, -al, 1 + al, -2 * cs, 1 - al];
  else if (type === "peak") [b0, b1, b2, a0, a1, a2] = [1 + al * A, -2 * cs, 1 - al * A, 1 + al / A, -2 * cs, 1 - al / A];
  else if (type === "lowshelf") {
    const s = 2 * Math.sqrt(A) * al;
    [b0, b1, b2, a0, a1, a2] = [A * (A + 1 - (A - 1) * cs + s), 2 * A * (A - 1 - (A + 1) * cs), A * (A + 1 - (A - 1) * cs - s), A + 1 + (A - 1) * cs + s, -2 * (A - 1 + (A + 1) * cs), A + 1 + (A - 1) * cs - s];
  } else if (type === "highshelf") {
    const s = 2 * Math.sqrt(A) * al;
    [b0, b1, b2, a0, a1, a2] = [A * (A + 1 + (A - 1) * cs + s), -2 * A * (A - 1 + (A + 1) * cs), A * (A + 1 + (A - 1) * cs - s), A + 1 - (A - 1) * cs + s, 2 * (A - 1 - (A + 1) * cs), A + 1 - (A - 1) * cs - s];
  } else throw new Error(type);
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** Runs a biquad over a signal in place; `cutoff(i)` may change the frequency every 64 samples (sweeps). */
export function filter(x, type, f, q = 0.707, gainDb = 0) {
  let c = biquad(type, typeof f === "function" ? f(0) : f, q, gainDb);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    if (typeof f === "function" && i % 64 === 0) c = biquad(type, f(i), q, gainDb);
    const y = c.b0 * x[i] + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    x[i] = y;
  }
  return x;
}

export const filterBus = (b, type, f, q, gainDb) => {
  filter(b.L, type, f, q, gainDb);
  filter(b.R, type, f, q, gainDb);
  return b;
};

/* ── Sources ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** n samples of white noise in −1 … 1. */
export function noise(n, rand) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rand() * 2 - 1;
  return out;
}

/** Envelope: linear attack, exponential decay with time constant tau, optional hold and release. */
export function env(n, { attack = 0.002, tau = 0.3, hold = Infinity, release = 0.05 }) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let v = t < attack ? t / attack : Math.exp(-(t - attack) / tau);
    if (t > hold) v *= Math.exp(-(t - hold) / release);
    out[i] = v;
  }
  return out;
}

/** Karplus–Strong pluck (a soft nylon / marimba-like tone with the lowpass in the loop). */
export function pluck(freq, seconds, rand, { damp = 0.5, bright = 0.6 } = {}) {
  const n = Math.ceil(seconds * RATE);
  const p = Math.max(2, Math.round(RATE / freq));
  const buf = new Float32Array(p);
  for (let i = 0; i < p; i++) buf[i] = rand() * 2 - 1;
  // Soften the excitation (fewer harsh highs).
  for (let k = 0; k < 2; k++) for (let i = 1; i < p; i++) buf[i] = buf[i] * bright + buf[i - 1] * (1 - bright);
  const out = new Float32Array(n);
  let j = 0;
  const g = 0.996 - damp * 0.01;
  for (let i = 0; i < n; i++) {
    const a = buf[j];
    const b = buf[(j + 1) % p];
    const v = g * 0.5 * (a + b);
    buf[j] = v;
    out[i] = a;
    j = (j + 1) % p;
  }
  return out;
}

/* ── Effects ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** Freeverb (Jezar's tunings), wet only. */
export function reverb(b, { room = 0.82, damp = 0.35, width = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allps = [556, 441, 341, 225];
  const k = RATE / 44100;
  const run = (x, spread) => {
    const out = new Float32Array(x.length);
    const cs = combs.map((d) => ({ buf: new Float32Array(Math.round((d + spread) * k)), i: 0, f: 0 }));
    const as = allps.map((d) => ({ buf: new Float32Array(Math.round((d + spread) * k)), i: 0 }));
    for (let n = 0; n < x.length; n++) {
      const inp = x[n] * 0.015;
      let s = 0;
      for (const c of cs) {
        const y = c.buf[c.i];
        c.f = y * (1 - damp) + c.f * damp;
        c.buf[c.i] = inp + c.f * room;
        c.i = (c.i + 1) % c.buf.length;
        s += y;
      }
      for (const a of as) {
        const y = a.buf[a.i];
        a.buf[a.i] = s + y * 0.5;
        a.i = (a.i + 1) % a.buf.length;
        s = y - s;
      }
      out[n] = s;
    }
    return out;
  };
  const mono = new Float32Array(b.L.length);
  for (let i = 0; i < mono.length; i++) mono[i] = (b.L[i] + b.R[i]) / 2;
  const L = run(mono, 0);
  const R = run(mono, 23);
  const w1 = (1 + width) / 2;
  const w2 = (1 - width) / 2;
  const out = { L: new Float32Array(L.length), R: new Float32Array(L.length) };
  for (let i = 0; i < L.length; i++) {
    out.L[i] = L[i] * w1 + R[i] * w2;
    out.R[i] = R[i] * w1 + L[i] * w2;
  }
  return out;
}

/** Ping-pong delay, wet only. */
export function pingPong(b, seconds, feedback = 0.35, tone = 3500) {
  const d = Math.round(seconds * RATE);
  const out = { L: new Float32Array(b.L.length), R: new Float32Array(b.L.length) };
  for (let i = d; i < b.L.length; i++) {
    out.L[i] = (b.R[i - d] + b.L[i - d]) * 0.5 + out.R[i - d] * feedback;
    out.R[i] = out.L[i - d] * feedback;
  }
  return filterBus(out, "lp", tone);
}

/** Gain over time (sidechain, automation): `g(t)` per sample. */
export function shape(b, g) {
  for (let i = 0; i < b.L.length; i++) {
    const v = g(i / RATE);
    b.L[i] *= v;
    b.R[i] *= v;
  }
  return b;
}

/* ── Loudness (ITU-R BS.1770-4) ──────────────────────────────────────────────────────────────────────────── */

/** Integrated loudness, LUFS, with the absolute and relative gates. */
export function lufs(b) {
  const kw = (x) => {
    const y = Float32Array.from(x);
    // K-weighting at 48 kHz (the standard's coefficients).
    const stages = [
      { b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285, a1: -1.69065929318241, a2: 0.73248077421585 },
      { b0: 1.0, b1: -2.0, b2: 1.0, a1: -1.99004745483398, a2: 0.99007225036621 },
    ];
    for (const c of stages) {
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < y.length; i++) {
        const v = c.b0 * y[i] + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
        x2 = x1;
        x1 = y[i];
        y2 = y1;
        y1 = v;
        y[i] = v;
      }
    }
    return y;
  };
  const L = kw(b.L);
  const R = kw(b.R);
  const block = Math.round(0.4 * RATE);
  const hop = Math.round(0.1 * RATE);
  const ms = [];
  for (let s = 0; s + block <= L.length; s += hop) {
    let e = 0;
    for (let i = s; i < s + block; i++) e += L[i] * L[i] + R[i] * R[i];
    ms.push(e / block);
  }
  const loud = (m) => -0.691 + 10 * Math.log10(m);
  const abs = ms.filter((m) => loud(m) > -70);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const rel = loud(mean(abs)) - 10;
  return loud(mean(abs.filter((m) => loud(m) > rel)));
}

/** True peak estimate (4× oversampled with cubic interpolation), dBTP. */
export function truePeak(b) {
  let p = 0;
  for (const x of [b.L, b.R]) {
    for (let i = 1; i < x.length - 2; i++) {
      for (let k = 0; k < 4; k++) {
        const t = k / 4;
        const [y0, y1, y2, y3] = [x[i - 1], x[i], x[i + 1], x[i + 2]];
        const v = y1 + 0.5 * t * (y2 - y0 + t * (2 * y0 - 5 * y1 + 4 * y2 - y3 + t * (3 * (y1 - y2) + y3 - y0)));
        p = Math.max(p, Math.abs(v));
      }
    }
  }
  return 20 * Math.log10(p);
}

/** Smooth peak limiter: look-ahead gain riding so |x| stays under `ceilingDb` (with a soft knee). */
export function limit(b, ceilingDb = -1.2, lookahead = 0.004, release = 0.12) {
  const ceil = dbGain(ceilingDb);
  const n = b.L.length;
  const la = Math.round(lookahead * RATE);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i]));
    need[i] = a > ceil ? ceil / a : 1;
  }
  // Minimum over the look-ahead window (so the gain is down before the peak arrives), then a smooth release.
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let m = need[i];
    for (let k = 1; k <= la && i + k < n; k++) m = Math.min(m, need[i + k]);
    g[i] = m;
  }
  const rel = Math.exp(-1 / (release * RATE));
  let cur = 1;
  for (let i = 0; i < n; i++) {
    cur = g[i] < cur ? g[i] : g[i] + (cur - g[i]) * rel;
    b.L[i] *= cur;
    b.R[i] *= cur;
  }
  return b;
}

/* ── WAV ─────────────────────────────────────────────────────────────────────────────────────────────────── */

/** 16-bit stereo WAV with TPDF dither. */
export function writeWav(file, b) {
  const n = b.L.length;
  const out = Buffer.alloc(44 + n * 4);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + n * 4, 4);
  out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(RATE, 24);
  out.writeUInt32LE(RATE * 4, 28);
  out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(n * 4, 40);
  const r = rng(7);
  for (let i = 0; i < n; i++) {
    for (const [k, x] of [b.L, b.R].entries()) {
      const d = (r() - r()) / 32768;
      const v = Math.max(-1, Math.min(1, x[i] + d));
      out.writeInt16LE(Math.round(v * 32767), 44 + i * 4 + k * 2);
    }
  }
  fs.writeFileSync(file, out);
}
