import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { CONTACTS } from "../../data/site";
import { NBSP } from "../../data/typo";
import { LogoBuild, logoSchedule } from "../../effects/LogoBuild";
import { Curtains } from "../../primitives/Curtains";
import { Pill } from "../../primitives/Chip";
import { FadeRise } from "../../primitives/MaskRise";
import { tabular, text } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { color } from "../../theme/tokens";

/** The logo of the end (brief P10: ≈ 720 wide), a little above the middle to leave room for the stats and contacts. */
const LOGO = { width: 720, x: 960, y: 420 };

/** The four numbers of the site's hero, step 6 frames (60 fps): they come in, hold a bar, and give way to the contacts. */
function Stats({ from, exit }: { from: number; exit: number }) {
  const t = useTiming();
  const step = Math.round((6 * t.fps) / 60);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", gap: 120 }}>
      {copy.promo.stats.map(([value, caption], i) => (
        <FadeRise key={caption} from={from + i * step} duration={t.b(1)} exit={{ from: exit + i * step, duration: t.e(1) }} style={{ textAlign: "center" }}>
          <div style={{ ...tabular, fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em", color: color.ink, whiteSpace: "nowrap" }}>{value}</div>
          <div style={{ ...text(18), color: color.ink3, marginTop: 6 }}>{caption}</div>
        </FadeRise>
      ))}
    </div>
  );
}

/** Lucide icons (24 px grid), drawn in the text colour. */
const ICON = {
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01",
};

function Icon({ d, size }: { d: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
      <path d={d} fill="none" stroke={color.ink2} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Where to go, in order of weight: the site in the accent pill, then the phones and Instagram under it (one idea per
 * line, so the eye has one place to start).
 */
function Contacts({ from }: { from: number }) {
  const t = useTiming();
  const row = { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, ...text(30), color: color.ink } as const;
  return (
    <>
      <FadeRise from={from} duration={t.b(1)} style={{ position: "absolute", left: 0, right: 0, top: 660, textAlign: "center" }}>
        <Pill size={40}>{copy.promo.site}</Pill>
      </FadeRise>
      <FadeRise from={from + t.e(1)} duration={t.b(1)} style={{ position: "absolute", left: 0, right: 0, top: 800, ...row }}>
        <Icon d={ICON.phone} size={28} />
        {CONTACTS.phones.map((p, i) => (
          <span key={p.href} style={tabular}>
            {i ? <span style={{ color: color.ink4, marginRight: 14 }}>·</span> : null}
            {p.label.replace(/ /g, NBSP)}
          </span>
        ))}
      </FadeRise>
      <FadeRise from={from + t.b(1)} duration={t.b(1)} style={{ position: "absolute", left: 0, right: 0, top: 856, ...row }}>
        <Icon d={ICON.instagram} size={28} />
        <span>{CONTACTS.instagram.handle}</span>
      </FadeRise>
    </>
  );
}

/**
 * P10–P11 (bars 18–20): curtains ink → accent → paper (1b, menu-in, motion blur) leave a clean sheet; the logo builds
 * (wave, three beads, letters); on P11's downbeat the dot pops and GALLERY closes in; the four numbers come in under
 * it and give way to the contacts — the site in the accent pill, the phones, Instagram; at P11 +6b the dot breathes
 * once and the frame holds. Frames relative to P10.
 */
export function P10Final() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const p11 = t.bar(1);
  const curtains = frame < t.b(1) + 2;
  return (
    <AbsoluteFill>
      {curtains ? (
        <CameraMotionBlur shutterAngle={180} samples={8}>
          <Curtains from={0} duration={t.b(1)} />
        </CameraMotionBlur>
      ) : (
        <AbsoluteFill style={{ backgroundColor: color.paper }} />
      )}
      <LogoBuild {...LOGO} schedule={logoSchedule.promo(t)} />
      <Stats from={p11 + t.b(1)} exit={p11 + t.b(3)} />
      <Contacts from={p11 + t.b(3.5)} />
    </AbsoluteFill>
  );
}
