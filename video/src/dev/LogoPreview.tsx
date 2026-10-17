import { AbsoluteFill, useCurrentFrame } from "remotion";
import { copy } from "../data/copy";
import { AvatarOutro, CollapseToDot } from "../effects/AvatarOutro";
import { LogoBuild, logoGeometry, logoSchedule } from "../effects/LogoBuild";
import { FadeRise } from "../primitives/MaskRise";
import { Grain } from "../primitives/Grain";
import { Wall } from "../primitives/Wall";
import { ease, mix, progress } from "../theme/easing";
import { label, text } from "../theme/fonts";
import { useTiming } from "../theme/timing";
import { color, stroke } from "../theme/tokens";

// Dev preview of Reels R8 (bars 10–12) compressed into one composition: frames relative to R8 start.

const LOGO = { width: 820, x: 540, y: 700 };

/** Placeholder for the scene's morph: canvas edge (vertical line) → horizontal thread on the wave's axis. */
function EdgeToWave() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const g = logoGeometry(LOGO.width, LOGO.x, LOGO.y);
  const wy = (g.wave.y0 + g.wave.y1) / 2;
  const p = progress(frame, t.e(1), t.b(1), ease.inOut);
  const fade = 1 - progress(frame, t.b(1.5), t.s(1), ease.out);
  if (fade <= 0) return null;
  const a = { x: mix(LOGO.x, g.wave.x0, p), y: mix(LOGO.y - 190, wy, p) };
  const b = { x: mix(LOGO.x, g.wave.x1, p), y: mix(LOGO.y + 190, wy, p) };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fade }}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color.ink} strokeWidth={stroke.reels} strokeLinecap="round" />
    </svg>
  );
}

function Cta() {
  const t = useTiming();
  const c = copy.reels;
  const center = { position: "absolute", left: 65, right: 65, textAlign: "center", color: color.ink } as const;
  return (
    <>
      <FadeRise from={t.b(5)} duration={t.b(1)} style={{ ...center, top: 905 }}>
        <div style={text(30)}>{c.ctaLine1}</div>
      </FadeRise>
      <FadeRise from={t.b(5.5)} duration={t.b(1)} style={{ ...center, top: 950 }}>
        <div style={text(30)}>{c.ctaLine2}</div>
      </FadeRise>
      <FadeRise from={t.b(6)} duration={t.b(1)} style={{ ...center, top: 1010 }}>
        <div
          style={{
            ...text(30, 500),
            display: "inline-flex",
            alignItems: "center",
            height: 84,
            padding: "0 48px",
            borderRadius: 999,
            background: color.accent,
            color: color.onAccent,
          }}
        >
          {c.ctaButton}
        </div>
      </FadeRise>
      <FadeRise from={t.b(6.25)} duration={t.b(1)} style={{ ...center, top: 1112 }}>
        <div style={{ ...label(26), color: color.ink2 }}>{c.ctaSite}</div>
      </FadeRise>
    </>
  );
}

export const LogoPreview: React.FC = () => {
  const t = useTiming();
  const g = logoGeometry(LOGO.width, LOGO.x, LOGO.y);
  return (
    <AbsoluteFill>
      <Wall windowShadow />
      <CollapseToDot dot={g.dot} collapse={{ from: t.b(11), duration: t.b(0.75) }} exit={{ from: t.b(11.75), duration: t.s(1) }}>
        <AvatarOutro origin={{ x: g.dot.cx, y: g.dot.cy }} reveal={{ from: t.b(8), duration: t.b(1) }} lattice={{ from: t.b(8.5), duration: t.b(1.5) }} />
        <EdgeToWave />
        <LogoBuild {...LOGO} schedule={logoSchedule.reels(t)} />
        <Cta />
      </CollapseToDot>
      <Grain />
    </AbsoluteFill>
  );
};
