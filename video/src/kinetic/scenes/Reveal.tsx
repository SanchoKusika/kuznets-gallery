import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { K, Letters, sans, serif } from "../kit";

const PAINT_W = 580;
const PAINT_H = 573;
const CY = 960;

/** Turn about the vertical axis for a flip: the old picture turns to its edge, the next one turns in. */
const flip = (frame: number, at: number, half: number) => (frame < at ? 90 * progress(frame, at - half, half, ease.in) : -90 * (1 - progress(frame, at, half + 2, ease.out)));

/**
 * Beats 8–11, on black: «КАРТИНА» slams in, splits along its waist — the halves part and become the top and bottom
 * of a frame, the picture (She Is Uzbek) is inside the gap, white rules close the frame's sides; the camera turns
 * slowly round it. Then the picture flips over into the next one. Frames relative to the scene.
 */
export function PaintingScene() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const B = t.b(1);
  const slam = progress(frame, 0, 8, ease.out);
  const shake = (1 - progress(frame, 6, 16, ease.out)) * 14;
  const sx = (random(`ps${Math.floor(frame / 2)}`) - 0.5) * shake;
  const sy = (random(`py${Math.floor(frame / 2)}`) - 0.5) * shake;
  const split = progress(frame, B * 0.8, 16, ease.inOut);
  const gap = PAINT_H + 80;
  const rules = progress(frame, B * 0.8 + 12, 14, ease.out);
  const out = progress(frame, B * 2.5, 12, ease.in);
  const turn = mix(-9, 7, progress(frame, 0, B * 3, ease.inOut));
  const zoom = mix(1, 1.06, progress(frame, 0, B * 3, ease.inOut));
  const half = (top: boolean) => {
    const dy = (top ? -1 : 1) * (split * gap * 0.5 + out * 900);
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CY - 104,
          display: "flex",
          justifyContent: "center",
          clipPath: top ? "inset(-20% 0 50% 0)" : "inset(50% 0 -20% 0)",
          translate: `0 ${dy}px`,
        }}
      >
        <div style={{ ...sans(214, 900, K.white, { textTransform: "uppercase", letterSpacing: "-0.035em", lineHeight: 1 }), scale: String(mix(1.22, 1, slam)), opacity: Math.min(1, slam * 3) }}>картина</div>
      </div>
    );
  };
  // The flip ends exactly on the cut: S5 turns its picture in from the same edge.
  const rotY = flip(frame, B * 3, 6);
  return (
    <AbsoluteFill style={{ background: K.ink, perspective: 1800 }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotateY(${turn}deg) scale(${zoom})`, transformStyle: "preserve-3d" }}>
        {split > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 540 - PAINT_W / 2,
              top: CY - PAINT_H / 2,
              transform: `perspective(1600px) rotateY(${rotY}deg) scale(${mix(0.9, 1, split)})`,
              opacity: Math.min(1, split * 2),
            }}
          >
            <ArtImage code="KZ-022" width={PAINT_W} height={PAINT_H} parentScale={zoom} />
          </div>
        ) : null}
        {rules > 0 ? (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
            {[-1, 1].map((s) => (
              <path key={s} d={`M${540 + s * 470} ${CY - (gap / 2) * rules} V${CY + (gap / 2) * rules}`} stroke={K.white} strokeWidth={6} strokeLinecap="round" />
            ))}
          </svg>
        ) : null}
        {half(true)}
        {half(false)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/**
 * Beats 11–14, on the picture's warm colour: the lips (KZ-068) flip in; «которая» rises in light italic above
 * it, then «скажет» bursts out of the mouth letter by letter, flies at the camera and lands as a black word below;
 * at the end it flies past the camera. Frames relative to the scene.
 */
export function SaysScene() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const B = t.b(1);
  const rotY = -90 * (1 - progress(frame, 0, 8, ease.out));
  const word = "скажет";
  const n = word.length;
  const size = 236;
  const adv = size * 0.56;
  const mouth = { x: 540, y: 930 };
  const wordY = 1360;
  const away = progress(frame, B * 2.6, 12, ease.in);
  return (
    <AbsoluteFill style={{ background: "#F6E2CF", perspective: 1400 }}>
      <div style={{ position: "absolute", left: 540 - 300, top: 930 - 297, transform: `perspective(1600px) rotateY(${rotY}deg) scale(${1 + 0.03 * progress(frame, 0, B * 3, ease.linear)})` }}>
        <ArtImage code="KZ-068" width={600} height={594} shadow parentScale={1.03} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", overflow: "hidden", paddingBottom: 20 }}>
        <Letters text="которая" style={serif(120, 300, K.ink)} letter={(i) => ({ translate: `0 ${(1 - progress(frame, 6 + i * 2, 14, ease.rise)) * 110}%` })} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: wordY - size * 0.7, display: "flex", justifyContent: "center", transformStyle: "preserve-3d" }}>
        <Letters
          text={word}
          style={sans(size, 900, K.ink)}
          letter={(i) => {
            const from = B + i * 3;
            const p = progress(frame, from, 16, ease.out);
            if (frame < from) return { opacity: 0 };
            // From the mouth, towards the camera, then down into the word.
            const ox = mouth.x - (540 + (i - (n - 1) / 2) * adv);
            const oy = mouth.y - wordY;
            const arc = Math.sin(Math.PI * p) * 420;
            const z = arc - away * 1800;
            return {
              transform: `translate3d(${ox * (1 - p)}px, ${oy * (1 - p) - arc * 0.25}px, ${z}px) rotate(${(1 - p) * (i % 2 ? 40 : -40)}deg)`,
              color: p < 1 ? K.accent : K.ink,
              opacity: Math.min(1, p * 4) * (1 - progress(away, 0.7, 0.3, ease.linear)),
            };
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

/**
 * Beats 14–16, on white: «за» slides in hairline-thin; «тебя» swings round to the viewer like a door in heavy
 * italic, an accent rule draws under it; everything whips up into the next scene. Frames relative to the scene.
 */
export function ForYouScene() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const B = t.b(1);
  const door = progress(frame, 6, 18, ease.out);
  const rule = progress(frame, 20, 12, ease.out);
  const whip = progress(frame, B * 1.65, 12, ease.in);
  return (
    <AbsoluteFill style={{ background: K.white }}>
      <AbsoluteFill style={{ perspective: 1600, translate: `0 ${-whip * 1900}px`, rotate: `${mix(-2, 1, progress(frame, 0, B * 2, ease.inOut))}deg` }}>
      <div style={{ position: "absolute", left: 110, top: 600, overflow: "hidden", paddingBottom: 30 }}>
        <div style={{ ...sans(170, 200, K.ink), translate: `${(1 - progress(frame, 0, 12, ease.out)) * -110}% 0` }}>за</div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 780, transformOrigin: "0 50%", transform: `rotateY(${(1 - door) * -88}deg)` }}>
        <div style={serif(350, 800, K.ink)}>тебя</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={`M100 1150H${100 + 860 * rule}`} stroke={K.accent} strokeWidth={14} strokeLinecap="round" />
      </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
