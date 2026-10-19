import { AbsoluteFill, Sequence } from "remotion";
import { ShortSoundtrack } from "../audio/ShortSoundtrack";
import { AD_CUES, AD_MUSIC } from "../audio/shortCues";
import { MorphFilter } from "../primitives/MorphText";
import { BpmContext, timingAt, useTiming } from "../theme/timing";
import { bold } from "../theme/tokens";
import { AD, AD_BEATS, AD_BPM } from "./layout";
import { A1Hook } from "./scenes/A1Hook";
import { A2Wall } from "./scenes/A2Wall";
import { A3Rooms } from "./scenes/A3Rooms";
import { A4Formats } from "./scenes/A4Formats";
import { A5Custom } from "./scenes/A5Custom";
import { A6Montage } from "./scenes/A6Montage";
import { A7Logo } from "./scenes/A7Logo";

const SCENES = [
  { id: "A1 Хук", from: AD.hook, to: AD.wall, C: A1Hook },
  { id: "A2 Стена", from: AD.wall, to: AD.rooms, C: A2Wall },
  { id: "A3 Комнаты", from: AD.rooms, to: AD.formats, C: A3Rooms },
  { id: "A4 Форматы", from: AD.formats, to: AD.custom, C: A4Formats },
  { id: "A5 На заказ", from: AD.custom, to: AD.montage, C: A5Custom },
  { id: "A6 Монтаж", from: AD.montage, to: AD.logo, C: A6Montage },
  { id: "A7 Логотип", from: AD.logo, to: AD_BEATS, C: A7Logo },
] as const;

/**
 * Ad reel 1080×1920, 15 s at 120 BPM: a fast, bold, light ad for the gallery — paint over the pictures, liquid type,
 * the wall, the rooms, the formats in 3D, the custom work, a montage, the logo.
 */
export const Ad: React.FC = () => {
  return (
    <BpmContext.Provider value={AD_BPM}>
      <AbsoluteFill style={{ backgroundColor: bold.bg }}>
        <MorphFilter />
        <AdScenes />
        <ShortSoundtrack music={AD_MUSIC} cues={AD_CUES} />
      </AbsoluteFill>
    </BpmContext.Provider>
  );
};

function AdScenes() {
  return (
    <>
      {SCENES.map(({ id, from, to, C }) => (
        <SceneSlot key={id} name={id} from={from} to={to}>
          <C />
        </SceneSlot>
      ))}
    </>
  );
}

function SceneSlot({ name, from, to, children }: { name: string; from: number; to: number; children: React.ReactNode }) {
  const t = useTiming();
  return (
    <Sequence name={name} from={t.b(from)} durationInFrames={t.b(to - from)}>
      {children}
    </Sequence>
  );
}

/** Length in frames at the given fps. */
export const adFrames = (fps: number) => timingAt(fps, AD_BPM).b(AD_BEATS);
