import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { getStaticFiles, staticFile } from "remotion";
import { useTiming } from "../theme/timing";
import type { ShortCue } from "./shortCues";

/** SFX bus under the music (as in Soundtrack.tsx). */
const SFX_BUS_DB = -14;
const gain = (db: number) => 10 ** (db / 20);

/** The short reels' sound: one music file from frame 0 and the effects at their beats; missing files stay silent. */
export function ShortSoundtrack({ music, cues }: { music: string; cues: ShortCue[] }) {
  const t = useTiming();
  const files = useMemo(() => new Set(getStaticFiles().map((f) => f.name.split("\\").join("/"))), []);
  // Contact sheets of frames render without sound (see Soundtrack.tsx).
  if (process.env.REMOTION_SILENT) return null;
  return (
    <>
      {files.has(music) ? <Audio name="Music" src={staticFile(music)} /> : null}
      {cues
        .filter((c) => files.has(`sfx/${c.id}.wav`))
        .map((c, i) => (
          <Audio key={`${c.id}-${i}`} name={`${c.id} @${c.beat}`} src={staticFile(`sfx/${c.id}.wav`)} from={Math.round(c.beat * t.b(1))} volume={gain(SFX_BUS_DB + c.gainDb)} />
        ))}
    </>
  );
}
