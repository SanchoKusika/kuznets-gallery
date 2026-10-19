import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, Sequence } from "remotion";
import { ShortSoundtrack } from "../audio/ShortSoundtrack";
import { KINETIC_CUES, KINETIC_MUSIC } from "../audio/shortCues";
import { BpmContext, timingAt, useTiming } from "../theme/timing";
import { K, KT, KT_BEATS, KT_BPM } from "./kit";
import { CharactersScene, FindScene, ManyScene } from "./scenes/Characters";
import { ForYouScene, PaintingScene, SaysScene } from "./scenes/Reveal";
import { WallWorld } from "./scenes/WallWorld";
import { WhoScene } from "./scenes/WhoScene";

/**
 * «Кто ты?» — kinetic type, Reels 1080×1920, ≈ 25 s at 100 BPM: «Стена молчит, пока не появится картина, которая
 * скажет за тебя, кто ты». Words become the things they name and open the paintings; three characters, each with
 * its own type and its own painting; 159 paintings — 159 characters; find yours.
 */
export const Kinetic: React.FC = () => (
  <BpmContext.Provider value={KT_BPM}>
    <AbsoluteFill style={{ background: K.ink }}>
      <CameraMotionBlur shutterAngle={180} samples={6}>
        <Scenes />
      </CameraMotionBlur>
      <ShortSoundtrack music={KINETIC_MUSIC} cues={KINETIC_CUES} />
    </AbsoluteFill>
  </BpmContext.Provider>
);

const SCENES = [
  { name: "Стена · молчит · пока не появится", from: KT.wall, to: KT.painting, C: WallWorld },
  { name: "Картина", from: KT.painting, to: KT.says, C: PaintingScene },
  { name: "Которая скажет", from: KT.says, to: KT.forYou, C: SaysScene },
  { name: "За тебя", from: KT.forYou, to: KT.who, C: ForYouScene },
  { name: "Кто ты?", from: KT.who, to: KT.bold, C: WhoScene },
  { name: "Смелый · спокойный · мечтатель", from: KT.bold, to: KT.many, C: CharactersScene },
  { name: "159 характеров", from: KT.many, to: KT.find, C: ManyScene },
  { name: "Найди свою", from: KT.find, to: KT_BEATS, C: FindScene },
] as const;

function Scenes() {
  const t = useTiming();
  return (
    <>
      {SCENES.map(({ name, from, to, C }) => (
        <Sequence key={name} name={name} from={t.b(from)} durationInFrames={t.b(to - from)}>
          <C />
        </Sequence>
      ))}
    </>
  );
}

export const kineticFrames = (fps: number) => timingAt(fps, KT_BPM).b(KT_BEATS);
