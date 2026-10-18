import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { getStaticFiles, interpolate, staticFile, useVideoConfig } from "remotion";
import { PROMO_SCENES, REELS_SCENES, type SceneSlot } from "../timeline";
import { timingAt } from "../theme/timing";
import { PROMO_CUES, REELS_CUES, type Cue } from "./cues";
import { MUSIC, PROMO_CALM_BARS, PROMO_EDIT, REELS_CALM_BARS, REELS_EDIT, type MusicSegment } from "./music-edit";

/** Master trim of the music, dB — set in stage 5 so the master lands at ≈ −14 LUFS. */
const MUSIC_DB = 0;
/** SFX bus under the music: the effects peak 15–25 dB under full scale, about 8–18 dB under the music (brief 9.2
 * asked 18–24 dB; that buried the synthesised effects). */
const SFX_BUS_DB = -14;
/** Drums in calm scenes when stems exist. */
const DUCK_DB = -12;

const gain = (db: number) => 10 ** (db / 20);

const VIDEOS = {
  reels: { scenes: REELS_SCENES, cues: REELS_CUES, edit: REELS_EDIT, calm: REELS_CALM_BARS, click: "audio/click-reels.wav" },
  promo: { scenes: PROMO_SCENES, cues: PROMO_CUES, edit: PROMO_EDIT, calm: PROMO_CALM_BARS, click: "audio/click-promo.wav" },
} as const;

/**
 * Music (edited by bars), or the click track while there is no music; stems with ducked drums in
 * calm scenes when they exist; and the SFX cues of every scene (missing files stay silent).
 */
export function Soundtrack({ video }: { video: keyof typeof VIDEOS }) {
  const { fps } = useVideoConfig();
  const t = timingAt(fps);
  const v = VIDEOS[video];
  const files = useMemo(() => new Set(getStaticFiles().map((f) => f.name.split("\\").join("/"))), []);
  const stems = Object.values(MUSIC.stems).every((f) => files.has(f));
  const music = files.has(MUSIC.file);

  return (
    <>
      {stems ? (
        <>
          <Edited src={MUSIC.stems.drums} edit={v.edit} duck={v.calm} name="Drums" />
          <Edited src={MUSIC.stems.bass} edit={v.edit} name="Bass" />
          <Edited src={MUSIC.stems.music} edit={v.edit} name="Music" />
        </>
      ) : music ? (
        <Edited src={MUSIC.file} edit={v.edit} name="Music" />
      ) : files.has(v.click) ? (
        <Audio name="Click track" src={staticFile(v.click)} volume={0.5} />
      ) : null}
      {v.scenes.map((scene) => (
        <SceneCues key={scene.id} scene={scene} cues={v.cues[scene.id] ?? []} files={files} start={t.bar(scene.fromBar)} />
      ))}
    </>
  );
}

function SceneCues({ scene, cues, files, start }: { scene: SceneSlot; cues: Cue[]; files: Set<string>; start: number }) {
  const t = timingAt(useVideoConfig().fps);
  return (
    <>
      {cues
        .filter((c) => files.has(`sfx/${c.id}.wav`))
        .map((c, i) => (
          <Audio
            key={`${c.id}-${i}`}
            name={`${scene.id} ${c.id}`}
            src={staticFile(`sfx/${c.id}.wav`)}
            from={start + t.b(c.at)}
            volume={gain(SFX_BUS_DB + c.gainDb)}
          />
        ))}
    </>
  );
}

/** One source file cut into bar segments with short crossfades; optional ducking on calm bars. */
function Edited({ src, edit, duck, name }: { src: string; edit: MusicSegment[]; duck?: readonly number[]; name: string }) {
  const { fps } = useVideoConfig();
  const t = timingAt(fps);
  const xf = Math.max(1, Math.round((MUSIC.crossfade * fps) / 60));
  let at = 0;
  return (
    <>
      {edit.map((seg, i) => {
        const from = at;
        at += t.bar(seg.bars);
        const last = i === edit.length - 1;
        const len = t.bar(seg.bars) + (last ? 0 : xf);
        return (
          <Audio
            key={i}
            name={`${name} ${seg.fromBar + 1}–${seg.fromBar + seg.bars}`}
            src={staticFile(src)}
            from={from}
            durationInFrames={len}
            trimBefore={Math.round(MUSIC.firstDownbeat * fps) + t.bar(seg.fromBar)}
            volume={(f) => {
              const fadeIn = i === 0 ? 1 : interpolate(f, [0, xf], [0, 1], { extrapolateRight: "clamp" });
              const fadeOut = last ? 1 : interpolate(f, [len - xf, len], [1, 0], { extrapolateLeft: "clamp" });
              return gain(MUSIC_DB) * fadeIn * fadeOut * (duck ? duckGain(from + f, duck, t) : 1);
            }}
          />
        );
      })}
    </>
  );
}

/** −12 dB inside calm bars, ramped over ½ beat at their edges. */
function duckGain(frame: number, calmBars: readonly number[], t: ReturnType<typeof timingAt>) {
  const ramp = t.e(1);
  let g = 1;
  for (const bar1 of calmBars) {
    const a = t.bar(bar1 - 1);
    const b = t.bar(bar1);
    const inside = interpolate(frame, [a - ramp, a, b, b + ramp], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    g = Math.min(g, 1 - inside * (1 - gain(DUCK_DB)));
  }
  return g;
}
