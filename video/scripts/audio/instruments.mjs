// Instruments of the generated music (scripts/make-music.mjs, scripts/make-reels-music.mjs): FM Rhodes, a plucked
// bass, a kit, a marimba-like hook, pads, a riser and an impact. Every source of noise draws from the `rand` passed in,
// in call order, so a track that calls them in the same order renders the same samples.

import { env, filter, midiHz, noise, pluck, RATE } from "./dsp.mjs";

export function instruments(rand) {
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

  return { rhodes, bass, kick, clap, hat, shaker, rim, hookNote, pad, riser, impact };
}
