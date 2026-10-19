import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { ShortSoundtrack } from "../audio/ShortSoundtrack";
import { SHOWREEL_CUES, SHOWREEL_MUSIC } from "../audio/shortCues";
import { fonts } from "../theme/fonts";
import { BpmContext, timingAt, useTiming } from "../theme/timing";
import { bold } from "../theme/tokens";
import { CHAPTERS, SR, SR_BEATS, SR_BPM } from "./layout";
import { S1Dot } from "./scenes/S1Dot";
import { S2Type } from "./scenes/S2Type";
import { S3Shapes } from "./scenes/S3Shapes";
import { S4Slices } from "./scenes/S4Slices";
import { S5Ring } from "./scenes/S5Ring";
import { S6Wall } from "./scenes/S6Wall";
import { S7Words } from "./scenes/S7Words";
import { S8Logo } from "./scenes/S8Logo";

const SCENES = [
  { id: "S1 Точка", from: SR.dot, to: SR.type, C: S1Dot },
  { id: "S2 Буквы", from: SR.type, to: SR.shapes, C: S2Type },
  { id: "S3 Формы", from: SR.shapes, to: SR.slices, C: S3Shapes },
  { id: "S4 Нарезка", from: SR.slices, to: SR.ring, C: S4Slices },
  { id: "S5 Кольцо", from: SR.ring, to: SR.wall, C: S5Ring },
  { id: "S6 Стена", from: SR.wall, to: SR.words, C: S6Wall },
  { id: "S7 Слова", from: SR.words, to: SR.logo, C: S7Words },
  { id: "S8 Логотип", from: SR.logo, to: SR_BEATS, C: S8Logo },
] as const;

/**
 * Showreel 1080×1920, 15 s at 120 BPM: the gallery as a motion-design reel — the dot and the wave, letters full of
 * pictures, morphing masks, slices and flips, a 3D ring, an endless wall, kinetic type, the logo. A thin HUD
 * (timecode, chapter) runs over everything but the end card.
 */
export const Showreel: React.FC = () => (
  <BpmContext.Provider value={SR_BPM}>
    <AbsoluteFill style={{ backgroundColor: bold.ink }}>
      {SCENES.map(({ id, from, to, C }) => (
        <Slot key={id} name={id} from={from} to={to}>
          <C />
        </Slot>
      ))}
      <Hud />
      <ShortSoundtrack music={SHOWREEL_MUSIC} cues={SHOWREEL_CUES} />
    </AbsoluteFill>
  </BpmContext.Provider>
);

function Slot({ name, from, to, children }: { name: string; from: number; to: number; children: React.ReactNode }) {
  const t = useTiming();
  return (
    <Sequence name={name} from={t.b(from)} durationInFrames={t.b(to - from)}>
      {children}
    </Sequence>
  );
}

/** Showreel furniture: name, timecode, chapter — white, difference-blended so it reads on any colour. */
function Hud() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTiming();
  if (frame >= t.b(SR.logo)) return null;
  const s = Math.floor(frame / fps);
  const f = frame % fps;
  const tc = `00:00:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
  const beat = frame / t.b(1);
  const chapter = CHAPTERS.filter((c) => c <= beat).length;
  const style: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonts.sans,
    fontWeight: 600,
    fontSize: 26,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#FFFFFF",
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <AbsoluteFill style={{ mixBlendMode: "difference", pointerEvents: "none" }}>
      <div style={{ ...style, left: 64, top: 120 }}>kuznetsovs gallery</div>
      <div style={{ ...style, right: 64, top: 120 }}>{tc}</div>
      <div style={{ ...style, left: 64, top: 1760 }}>showreel ’26</div>
      <div style={{ ...style, right: 64, top: 1760 }}>
        {String(chapter).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}
      </div>
    </AbsoluteFill>
  );
}

/** Length in frames at the given fps. */
export const showreelFrames = (fps: number) => timingAt(fps, SR_BPM).b(SR_BEATS);
