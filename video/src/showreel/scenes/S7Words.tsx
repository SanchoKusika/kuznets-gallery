import type { CSSProperties } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { ease, mix, progress } from "../../theme/easing";
import { fonts } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { NBSP } from "../../data/typo";
import { bold } from "../../theme/tokens";
import { CY, lower } from "../layout";

type Move = "rise" | "scale" | "slide" | "pop" | "flip" | "fill" | "roll" | "wipe";
type Word = { text: string; bg: string; fg: string; size: number; move: Move; sub?: string };

/** Eight words on the eighths, each with its own entrance and colour field. */
const WORDS: Word[] = [
  { text: "авторские", bg: bold.accent, fg: bold.ink, size: 190, move: "rise" },
  { text: "картины", bg: bold.ink, fg: bold.bg, size: 210, move: "scale" },
  { text: "в наличии", bg: bold.yellow, fg: bold.ink, size: 180, move: "slide" },
  { text: "и", bg: bold.bg, fg: bold.accent, size: 900, move: "pop" },
  { text: "на заказ", bg: bold.accent, fg: bold.bg, size: 200, move: "flip" },
  { text: "печать", bg: bold.ink, fg: bold.yellow, size: 250, move: "fill" },
  { text: "3–7 дней", bg: bold.bg, fg: bold.ink, size: 210, move: "roll" },
  { text: "доставка", bg: bold.yellow, fg: bold.ink, size: 200, move: "wipe", sub: "по всему узбекистану" },
];

/** Per-letter style for a move at progress p (0…1) of letter i of n. */
function letterStyle(move: Move, p: number, i: number): CSSProperties {
  switch (move) {
    case "rise":
      return { translate: `0 ${(1 - p) * 110}%`, display: "inline-block" };
    case "scale":
      return { scale: String(p), display: "inline-block", opacity: Math.min(1, p * 3) };
    case "flip":
      return { transform: `perspective(600px) rotateX(${(1 - p) * -100}deg)`, display: "inline-block", opacity: Math.min(1, p * 4), transformOrigin: "50% 100%" };
    case "roll":
      return { translate: `0 ${(1 - p) * (i % 2 ? -120 : 120)}%`, display: "inline-block" };
    default:
      return { display: "inline-block" };
  }
}

/**
 * S7 (beats 21–25): kinetic type — «авторские / картины / в наличии / и / на заказ / печать / 3–7 дней / доставка»,
 * one word per eighth, each on its own colour with its own entrance (letters rising, scaling, flipping, rolling;
 * a slide, a pop, a picture inside the word, a wipe). Frames relative to S7.
 */
export function S7Words() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const len = t.e(1);
  const k = Math.min(WORDS.length - 1, Math.floor(frame / len));
  const w = WORDS[k];
  const local = frame - k * len;
  const letters = w.text.split("");
  const n = letters.length;
  const whole = progress(local, 0, len - 3, ease.out);
  const base: CSSProperties = { ...lower(w.size, w.fg), whiteSpace: "pre" };

  let word: React.ReactNode;
  if (w.move === "slide") {
    word = <div style={{ ...base, transform: `translateX(${(1 - whole) * 900}px) skewX(${(1 - whole) * -18}deg)` }}>{w.text}</div>;
  } else if (w.move === "pop") {
    word = <div style={{ ...base, lineHeight: 0.8, scale: String(mix(0.2, 1, whole) + 0.12 * Math.sin(Math.PI * whole)) }}>{w.text}</div>;
  } else if (w.move === "fill") {
    // The word as a window onto a picture, panning inside it.
    word = (
      <div style={{ position: "relative" }}>
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <clipPath id="s7-fill" clipPathUnits="userSpaceOnUse">
              <text x={490} y={w.size * 0.78} textAnchor="middle" style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: w.size, letterSpacing: "-0.05em" }}>
                {w.text}
              </text>
            </clipPath>
          </defs>
        </svg>
        <div style={{ position: "relative", width: 980, height: w.size, clipPath: "url(#s7-fill)", scale: String(mix(1.15, 1, whole)) }}>
          <div style={{ position: "absolute", left: mix(-60, 0, whole), top: -170, width: 1040, height: 600 }}>
            <ArtImage code="KZ-004" width={1040} height={600} parentScale={mix(1.15, 1, whole)} />
          </div>
        </div>
      </div>
    );
  } else if (w.move === "wipe") {
    word = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ ...base, clipPath: `inset(0 ${(1 - whole) * 100}% 0 0)` }}>{w.text}</div>
        <div style={{ ...lower(60, w.fg), letterSpacing: "-0.02em", marginTop: 18, clipPath: `inset(0 ${(1 - progress(local, 3, len - 4, ease.out)) * 100}% 0 0)` }}>{w.sub}</div>
      </div>
    );
  } else {
    word = (
      <div style={{ ...base, overflow: w.move === "rise" || w.move === "roll" ? "hidden" : "visible", paddingBottom: w.size * 0.12 }}>
        {letters.map((ch, i) => {
          const order = w.move === "scale" ? Math.abs(i - (n - 1) / 2) : i;
          const p = progress(local, order * 1, len - 5, ease.out);
          return (
            <span key={i} style={letterStyle(w.move, p, i)}>
              {ch === " " ? NBSP : ch}
            </span>
          );
        })}
      </div>
    );
  }

  // A little camera shake on every cut.
  const shake = (1 - progress(local, 0, 6, ease.out)) * 10;
  const sx = (random(`s7-x${k}`) - 0.5) * shake;
  const sy = (random(`s7-y${k}`) - 0.5) * shake;

  return (
    <AbsoluteFill style={{ background: w.bg }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: CY - w.size * 0.6, display: "flex", justifyContent: "center", translate: `${sx}px ${sy}px` }}>{word}</div>
    </AbsoluteFill>
  );
}
