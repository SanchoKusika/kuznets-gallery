import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { ease, mix, progress } from "../../theme/easing";
import { fonts } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { K, sans } from "../kit";

/** Portraits from the catalogue, cycling inside the two letters (each ≤ 1.1× in its letter's box). */
const PORTRAITS = [
  ["KZ-024", "KZ-072", "KZ-053", "KZ-121"],
  ["KZ-022", "KZ-026", "KZ-122", "KZ-001"],
];
const SIZE = 620;
const GLYPHS = [
  { ch: "Т", x: 28, w: 420 },
  { ch: "Ы", x: 440, w: 612 },
];
const TOP = 640;
const H = 500;

/**
 * Beats 16–20, on black: «кто» hairline at the top; «ТЫ» fills the frame, each letter a window onto portraits from
 * the catalogue that change on alternate eighths; a drawn question mark with the logo's orange dot. The dot drops,
 * bounces and opens into the colour of the first character. Frames relative to the scene.
 */
export function WhoScene() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const B = t.b(1);
  const E = t.e(1);
  const enter = progress(frame, 10, 16, ease.out);
  const push = mix(1, 1.07, progress(frame, 0, B * 4, ease.inOut));
  const turn = mix(-5, 4, progress(frame, 0, B * 4, ease.inOut));
  // The question mark: hook draws, the dot pops, later it drops and opens up.
  const hook = progress(frame, B * 1, 14, ease.out);
  const dotIn = progress(frame, B * 1 + 10, 8, ease.out);
  const drop = progress(frame, B * 3.2, 16, ease.in);
  const bounce = frame > B * 3.2 + 16 ? Math.abs(Math.sin(((frame - B * 3.2 - 16) / 10) * Math.PI)) * 60 * Math.exp(-(frame - B * 3.2 - 16) / 8) : 0;
  const dotY = mix(1495, 1720, drop) - bounce;
  const open = progress(frame, B * 3.65, 13, ease.inOut);
  return (
    <AbsoluteFill style={{ background: K.ink, perspective: 1700 }}>
      <AbsoluteFill style={{ transform: `rotateY(${turn}deg) scale(${push})` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", overflow: "hidden", paddingBottom: 24 }}>
          <div style={{ ...sans(220, 200, K.white), translate: `0 ${(1 - progress(frame, 0, 14, ease.rise)) * 110}%` }}>кто</div>
        </div>
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            {GLYPHS.map((g, i) => (
              <clipPath key={i} id={`kt-ty-${i}`} clipPathUnits="userSpaceOnUse">
                <text x={g.w / 2} y={H * 0.995} textAnchor="middle" style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: SIZE }}>
                  {g.ch}
                </text>
              </clipPath>
            ))}
          </defs>
        </svg>
        {GLYPHS.map((g, i) => {
          const local = frame - (i ? E : 0);
          const k = Math.max(0, Math.floor(local / B)) % PORTRAITS[i].length;
          const sinceSwap = local - Math.floor(local / B) * B;
          const slide = local >= B ? (1 - progress(sinceSwap, 0, 8, ease.out)) * (i ? -H : H) : 0;
          const prev = PORTRAITS[i][(k + PORTRAITS[i].length - 1) % PORTRAITS[i].length];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: g.x,
                top: TOP + (1 - enter) * 160,
                width: g.w,
                height: H,
                clipPath: `url(#kt-ty-${i})`,
                opacity: Math.min(1, enter * 2),
                scale: String(mix(1.25, 1, enter)),
                background: "#222",
              }}
            >
              {slide !== 0 ? (
                <div style={{ position: "absolute", left: 0, top: slide - (i ? -H : H), width: g.w, height: H }}>
                  <ArtImage code={prev} width={g.w} height={H} parentScale={push} />
                </div>
              ) : null}
              <div style={{ position: "absolute", left: 0, top: slide, width: g.w, height: H }}>
                <ArtImage code={PORTRAITS[i][k]} width={g.w} height={H} parentScale={push} />
              </div>
            </div>
          );
        })}
        {/* A white outline keeps the letters' shapes legible over busy portraits. */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: Math.min(1, enter * 2) }}>
          {GLYPHS.map((g, i) => (
            <g key={i} transform={`translate(${g.x + g.w / 2} ${TOP + (1 - enter) * 160 + H / 2}) scale(${mix(1.25, 1, enter)}) translate(${-g.w / 2} ${-H / 2})`}>
              <text x={g.w / 2} y={H * 0.995} textAnchor="middle" fill="none" stroke={K.white} strokeWidth={6} style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: SIZE }}>
                {g.ch}
              </text>
            </g>
          ))}
        </svg>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {/* Only once it starts: a zero-length dash with round caps would leave a dot. */}
          {hook > 0 ? <path d="M800 1260C800 1150 1000 1150 1000 1260C1000 1345 900 1335 900 1410" fill="none" stroke={K.white} strokeWidth={62} strokeLinecap="round" pathLength={1} strokeDasharray={`${hook} 2`} /> : null}
          {dotIn > 0 ? <circle cx={900} cy={dotY} r={42 * dotIn} fill="#F48157" /> : null}
        </svg>
      </AbsoluteFill>
      {open > 0 ? <div style={{ position: "absolute", left: 900 * push - 2400 * open, top: dotY - 2400 * open, width: 4800 * open, height: 4800 * open, borderRadius: "50%", background: K.accent }} /> : null}
    </AbsoluteFill>
  );
}
