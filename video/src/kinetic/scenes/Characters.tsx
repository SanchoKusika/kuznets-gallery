import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ALLOWED, WORKS_COUNT } from "../../data/art";
import { CONTACTS } from "../../data/site";
import { LogoBuild, type LogoSchedule } from "../../effects/LogoBuild";
import { ArtImage } from "../../primitives/ArtImage";
import { useCounter } from "../../primitives/Counter";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { K, Letters, sans, serif } from "../kit";

/**
 * Beats 20–32: three characters, four beats each — each word set the way the character is, next to the painting
 * that is that character. «СМЕЛЫЙ»: black, slanted, every letter slams down and jolts the picture (Let's GO!).
 * «спокойный»: hairline italic rising slowly, drifting on the water line (Рыбаки). «мечтатель»: letters of mixed
 * weights float up like balloons (Воздушный шар). A tide carries one into the next, then the sky lifts away.
 * Frames relative to the scene.
 */
export function CharactersScene() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const P = t.b(4);
  const part = Math.min(2, Math.floor(frame / P));
  const f = frame - part * P;
  return part === 0 ? <Bold f={f} P={P} /> : part === 1 ? <Calm f={f} P={P} /> : <Dreamer f={f} P={P} />;
}

function Bold({ f, P }: { f: number; P: number }) {
  const { fps } = useVideoConfig();
  const word = "смелый";
  const hits = word.split("").map((_, i) => 10 + i * 4);
  const lastHit = hits.filter((h) => f >= h + 6).length;
  const sinceHit = lastHit > 0 ? f - (hits[lastHit - 1] + 6) : 99;
  const jolt = Math.exp(-sinceHit / 5) * (lastHit > 0 ? 1 : 0);
  const drop = spring({ frame: f - 2, fps, config: { damping: 11, stiffness: 140, mass: 0.9 } });
  const tide = progress(f, P - 18, 18, ease.inOut);
  const tideY = mix(2000, -100, tide);
  const wave = (x: number) => tideY + 40 * Math.sin(x * 0.01 + f * 0.25);
  const tidePath = `M0 1920L${Array.from({ length: 28 }, (_, i) => `${i * 40} ${wave(i * 40).toFixed(1)}`).join("L")}L1080 1920Z`;
  return (
    <AbsoluteFill style={{ background: K.accent }}>
      <AbsoluteFill
        style={{
          translate: `${(random(`b${Math.floor(f / 2)}`) - 0.5) * 22 * jolt}px ${(random(`by${Math.floor(f / 2)}`) - 0.5) * 22 * jolt}px`,
          scale: String(mix(1, 1.05, progress(f, 0, P, ease.inOut))),
          rotate: `${mix(-1.2, 1.2, progress(f, 0, P, ease.inOut))}deg`,
        }}
      >
        <div style={{ position: "absolute", left: 540 - 260, top: 1180 - 257 + (1 - drop) * -1400 + jolt * 14, rotate: `${-5 + jolt * 3}deg` }}>
          <ArtImage code="KZ-096" width={520} height={515} shadow />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center" }}>
          <Letters
            text={word}
            style={sans(220, 900, K.white, { textTransform: "uppercase", letterSpacing: "-0.04em" })}
            letter={(i) => {
              const p = progress(f, hits[i], 6, ease.in);
              const land = f >= hits[i] + 6 ? Math.exp(-(f - hits[i] - 6) / 4) : 0;
              return { transform: `translateY(${(1 - p) * -900}px) skewX(-10deg) scale(${1 + land * 0.18}, ${1 - land * 0.22})`, transformOrigin: "50% 100%", opacity: f >= hits[i] ? 1 : 0 };
            }}
          />
        </div>
      </AbsoluteFill>
      {tide > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path d={tidePath} fill={K.calm} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
}

function Calm({ f, P }: { f: number; P: number }) {
  const lift = progress(f, P - 16, 16, ease.in);
  const bob = (i: number) => Math.sin(f / 24 + i * 0.6) * 6;
  return (
    <AbsoluteFill style={{ background: K.calm }}>
      <AbsoluteFill style={{ translate: `${mix(-24, 24, progress(f, 0, P, ease.inOut))}px ${lift * 1920}px`, scale: "1.03" }}>
        <div style={{ position: "absolute", left: 540 - 280, top: 1060 - 277, scale: String(1 + 0.025 * progress(f, 0, P, ease.linear)) }}>
          <ArtImage code="KZ-099" width={560} height={554} shadow parentScale={1.025 * 1.03} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center" }}>
          <Letters
            text="спокойный"
            style={serif(150, 300, K.ink)}
            letter={(i) => {
              const p = progress(f, 4 + i * 4, 30, ease.out);
              return { opacity: p, translate: `0 ${(1 - p) * 36 + bob(i)}px` };
            }}
          />
        </div>
      </AbsoluteFill>
      {lift > 0 ? <AbsoluteFill style={{ background: `linear-gradient(${K.skyTop}, ${K.skyBottom})`, translate: `0 ${(lift - 1) * 1920}px` }} /> : null}
    </AbsoluteFill>
  );
}

function Dreamer({ f, P }: { f: number; P: number }) {
  const word = "мечтатель";
  const rise = progress(f, P - 18, 18, ease.in);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${K.skyTop}, ${K.skyBottom})` }}>
      <AbsoluteFill style={{ translate: `0 ${rise * 1920 + mix(40, -40, progress(f, 0, P, ease.inOut))}px` }}>
        <div style={{ position: "absolute", left: 540 - 260, top: 1160 - 257 + Math.sin(f / 30) * 10 }}>
          <ArtImage code="KZ-134" width={520} height={515} shadow />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", alignItems: "baseline" }}>
          {word.split("").map((ch, i) => {
            const p = progress(f, 2 + i * 3, 26, ease.out);
            const sway = Math.sin(f / 16 + i) * 10 * p;
            const up = (1 - p) * 900 - Math.max(0, f - 70 - i * 4) * (i % 3 === 0 ? 0.6 : 0.2);
            return (
              <span key={i} style={{ display: "inline-block", ...sans(170, i % 2 ? 200 : 900, K.ink), translate: `${sway}px ${up}px`, rotate: `${Math.sin(f / 20 + i) * 6}deg` }}>
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      {rise > 0 ? <AbsoluteFill style={{ background: K.ink, translate: `0 ${(rise - 1) * 1920}px` }} /> : null}
    </AbsoluteFill>
  );
}

/** Cards for the wall in perspective: works wide enough for a square card. */
const POOL = ALLOWED.filter((a) => Math.min(a.w, a.h) >= 200).map((a) => a.code);

/**
 * Beats 32–36, on black: the camera flies low over a tilted wall of paintings; «159» counts up, «характеров» in light
 * italic; the wall tips away into white. Frames relative to the scene.
 */
export function ManyScene() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const n = useCounter(WORKS_COUNT, 6, t.b(1.5));
  const away = progress(frame, t.b(3.4), 22, ease.in);
  const card = 200;
  const gap = 20;
  const cols = 9;
  const rows = 16;
  const run = frame * 7;
  return (
    <AbsoluteFill style={{ background: K.ink, perspective: 1200 }}>
      <div
        style={{
          position: "absolute",
          left: 540 - (cols * (card + gap)) / 2,
          top: 1100 - (rows * (card + gap)) / 2,
          width: cols * (card + gap),
          height: rows * (card + gap),
          transform: `rotateX(${mix(58, 80, away)}deg) rotateZ(-16deg) translateY(${(run % (card + gap)) - 400}px) translateZ(${-away * 600}px)`,
          opacity: 1 - away,
        }}
      >
        {Array.from({ length: cols * rows }, (_, i) => {
          const row = Math.floor(i / cols);
          const shift = Math.floor(run / (card + gap));
          const code = POOL[(i - shift * cols + POOL.length * 50) % POOL.length];
          return (
            <div key={i} style={{ position: "absolute", left: (i % cols) * (card + gap), top: row * (card + gap), width: card, height: card }}>
              <ArtImage code={code} width={card} height={card} parentScale={2} />
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(rgba(17,17,17,.95) 0%, rgba(17,17,17,.85) 38%, rgba(17,17,17,0) 62%)", opacity: 1 - away }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - away }}>
        <div style={{ ...sans(360, 900, K.white, { fontVariantNumeric: "tabular-nums", textShadow: "0 10px 40px rgba(0,0,0,.6)" }) }}>{n}</div>
        <div style={{ ...serif(130, 300, K.white, { textShadow: "0 8px 30px rgba(0,0,0,.7)" }), marginTop: 20, opacity: progress(frame, t.b(1), 14, ease.out) }}>характеров</div>
      </div>
      {away > 0 ? <AbsoluteFill style={{ background: K.white, opacity: progress(away, 0.6, 0.4, ease.linear) }} /> : null}
    </AbsoluteFill>
  );
}

/**
 * Beats 36–42, on white: «найди» hairline, «свою» black accent; they step up and the logo builds under them; the
 * site in an accent pill, the phones. Frames relative to the scene.
 */
export function FindScene() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const up = progress(frame, t.b(1.75), 18, ease.inOut);
  const from = t.b(2);
  const schedule: LogoSchedule = {
    wave: { from: from + 4, duration: t.e(1) },
    beads: [from + t.e(1), from + t.e(1) + t.s(1), from + t.b(1)],
    letters: from + t.e(1) + t.s(1),
    dot: from + t.b(1) + t.e(1),
    gallery: from + t.b(1) + t.e(1),
    breath: from + t.b(3),
  };
  return (
    <AbsoluteFill style={{ background: K.white }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: mix(640, 330, up), display: "flex", flexDirection: "column", alignItems: "center", scale: String(mix(1, 0.62, up)), transformOrigin: "50% 0" }}>
        <div style={{ overflow: "hidden", paddingBottom: 20 }}>
          <div style={{ ...sans(210, 200, K.ink), translate: `0 ${(1 - progress(frame, 0, 14, ease.rise)) * 110}%` }}>найди</div>
        </div>
        <div style={{ overflow: "hidden", paddingBottom: 30 }}>
          <div style={{ ...sans(280, 900, K.accent), translate: `0 ${(1 - progress(frame, 6, 14, ease.rise)) * 110}%` }}>свою</div>
        </div>
      </div>
      {frame >= from ? <LogoBuild width={860} x={540} y={980} schedule={schedule} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1230, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ overflow: "hidden", padding: "4px 10px 14px" }}>
          <div style={{ ...sans(60, 800, K.white), background: K.accent, borderRadius: 999, padding: "12px 40px 16px", translate: `0 ${(1 - progress(frame, from + t.b(2), 14, ease.rise)) * 130}%` }}>kuznets.uz</div>
        </div>
        <div style={{ ...sans(38, 600, K.ink, { letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }), opacity: progress(frame, from + t.b(2.5), 12, ease.out) }}>{CONTACTS.phones.map((p) => p.label).join("  ·  ")}</div>
      </div>
    </AbsoluteFill>
  );
}
