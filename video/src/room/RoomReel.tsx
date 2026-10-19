import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { ShortSoundtrack } from "../audio/ShortSoundtrack";
import { ROOM_CUES, ROOM_MUSIC } from "../audio/shortCues";
import { WORKS_COUNT } from "../data/art";
import { CONTACTS } from "../data/site";
import { LogoBuild, type LogoSchedule } from "../effects/LogoBuild";
import { ArtImage } from "../primitives/ArtImage";
import { MaskRise } from "../primitives/MaskRise";
import { useCounter } from "../primitives/Counter";
import { ease, progress } from "../theme/easing";
import { fonts } from "../theme/fonts";
import { BpmContext, timingAt, useTiming } from "../theme/timing";
import { bold } from "../theme/tokens";
import { art } from "../data/art";
import paletteJson from "../data/palette.json";
import { Furniture, Shell, Window } from "./Base";
import { Cat, type CatState } from "./Cat";
import { FX, type FxOut } from "./Fx";
import { INK, MONTAGE, ROOM_BEATS, ROOM_BPM, SCENES, sceneStart, T } from "./layout";
import { Painting, type Hang } from "./Painting";

const palette = paletteJson as Record<string, { vivid: string; deep: string }>;
const DULL = "#E4E2DE";
const WHITE = "#FFFFFF";

/**
 * «Одна картина меняет всю комнату» — Reels 1080×1920, 17 s at 120 BPM. A dull drawn room and a bored cat; a painting
 * drops onto the nail and the room becomes its world: jungle, a rainstorm, a flood with goldfish and a shark fin,
 * zero gravity, a desert, the sky, a dastarkhan. Then twelve more paintings in a blink, the seven as a choice
 * («какая твоя? пиши номер»), the logo with the cat.
 */
export const RoomReel: React.FC = () => (
  <BpmContext.Provider value={ROOM_BPM}>
    <AbsoluteFill style={{ background: WHITE }}>
      <Stage />
      <Captions />
      <Choice />
      <EndCard />
      <ShortSoundtrack music={ROOM_MUSIC} cues={ROOM_CUES} />
    </AbsoluteFill>
  </BpmContext.Provider>
);

export const roomFrames = (fps: number) => timingAt(fps, ROOM_BPM).b(ROOM_BEATS);

const sceneTint = (k: number) => (k < 0 ? DULL : interpolateColors(SCENES[k].tintK, [0, 1], [WHITE, SCENES[k].tint]));
/** Where the new room spills out of: the painting's centre. */
const SPILL = { x: 430, y: 810 } as const;
const REVEAL = 18;

/** Which room is on and how far in it is. */
function useRoomState() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const B = t.b(1);
  const beat = frame / B;
  const exitLen = 8;
  let fx: FxOut | null = null;
  let tint = DULL;
  let prevTint = DULL;
  let sceneIndex = -1;
  let local = 0;
  if (beat >= T.first && beat < T.montage) {
    sceneIndex = Math.min(SCENES.length - 1, Math.floor((beat - T.first) / T.per));
    local = frame - t.b(sceneStart(sceneIndex));
    const sc = SCENES[sceneIndex];
    const life = 1 - progress(local, t.b(T.per) - exitLen, exitLen, ease.in);
    fx = FX[sc.key]({ f: local, B, life, enter: progress(local, 0, B * 0.6, ease.out) });
    tint = sceneTint(sceneIndex);
    prevTint = sceneTint(sceneIndex - 1);
  } else if (beat >= T.montage) {
    const i = Math.min(MONTAGE.length - 1, Math.floor((frame - t.b(T.montage)) / t.s(1)));
    tint = interpolateColors(0.5, [0, 1], [WHITE, palette[MONTAGE[i]].vivid]);
  }
  // The new room spills out of the painting as a growing circle over the old one.
  const reveal = sceneIndex >= 0 && local < REVEAL ? progress(local, 0, REVEAL, ease.inOut) : null;
  return { frame, t, B, beat, fx, tint, prevTint, sceneIndex, local, reveal };
}

const tintFilter = (id: string, tint: string) => (
  <filter id={id} filterUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920} colorInterpolationFilters="sRGB">
    <feFlood floodColor={tint} result="t" />
    <feBlend in="SourceGraphic" in2="t" mode="multiply" result="m" />
    <feComposite in="m" in2="SourceAlpha" operator="in" />
  </filter>
);

/** The room behind the painting: shell, window, the scene's back layer, furniture — tinted. */
function RoomBack({ id, tint, fx, clip }: { id: string; tint: string; fx: FxOut | null; clip?: string }) {
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, clipPath: clip }}>
      <defs>{tintFilter(id, tint)}</defs>
      <g filter={`url(#${id})`}>
        <Shell />
      </g>
      <Window sky={fx?.sky} />
      {fx?.back}
      <g filter={`url(#${id})`}>
        <Furniture poses={fx?.poses} onRug={fx?.onRug} onTable={fx?.onTable} />
      </g>
    </svg>
  );
}

/** In front of the painting: the cat and the scene's front layer. */
function RoomFront({ cat, fx, clip }: { cat: CatState; fx: FxOut | null; clip?: string }) {
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, clipPath: clip }}>
      <Cat {...cat} />
      {fx?.front}
    </svg>
  );
}

function Stage() {
  const { frame, t, B, beat, fx, tint, prevTint, sceneIndex, local, reveal } = useRoomState();
  const hangs: Hang[] = [
    ...SCENES.map((sc, k): Hang => ({ code: sc.code, at: k === 0 ? t.b(T.hang) : t.b(sceneStart(k)), how: k === 0 ? "drop" : "flip", n: k + 1 })),
    ...MONTAGE.map((code, i): Hang => ({ code, at: t.b(T.montage) + i * t.s(1), how: "cut" })),
  ];
  // Camera: a punch on every new room, a slow push in between.
  const punch = sceneIndex >= 0 ? 1 + 0.03 * (1 - progress(local, 0, 12, ease.out)) : 1;
  const push = 1 + 0.015 * ((beat % T.per) / T.per);
  const z = punch * push;

  // The cat: bored in the intro, the scene's mood in the rooms, nodding along in the montage.
  const calm: CatState = { lids: 0, tail: Math.sin(frame / 10) * 12, head: -6 };
  let cat: CatState = { lids: 0.55, tail: Math.sin(frame / 40) * 8, head: 4 };
  if (fx) cat = { beat: local / B, ...fx.cat };
  else if (beat >= T.montage) cat = { head: Math.sin((frame / t.s(1)) * Math.PI) * 9, lids: 0, tail: Math.sin(frame / 6) * 20 };
  // The painting drops in on 2½ — the cat looks up.
  if (beat >= T.hang - 0.25 && beat < T.first) cat = { lids: 0, head: -16, tail: 20 };

  const r = reveal == null ? null : reveal * 1900;
  const clip = r == null ? undefined : `circle(${r}px at ${SPILL.x}px ${SPILL.y}px)`;
  return (
    <AbsoluteFill style={{ transformOrigin: "540px 1000px", scale: String(z) }}>
      {r != null ? <RoomBack id="room-tint-old" tint={prevTint} fx={null} /> : null}
      <RoomBack id="room-tint" tint={tint} fx={fx} clip={clip} />
      <Painting hangs={hangs} scale={z} />
      {r != null ? <RoomFront cat={calm} fx={null} /> : null}
      <RoomFront cat={cat} fx={fx} clip={clip} />
      {r != null && reveal != null && reveal < 1 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={SPILL.x} cy={SPILL.y} r={r} fill="none" stroke={INK} strokeWidth={10 * (1 - reveal) + 2} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
}

/** A caption sticker: white, ink border, bold. */
function Sticker({ children, size = 56, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        background: WHITE,
        border: `5px solid ${INK}`,
        borderRadius: 22,
        padding: "12px 26px 16px",
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color: INK,
        boxShadow: `8px 8px 0 ${INK}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ n, size = 56 }: { n: number; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bold.accent, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.55, fontWeight: 800, fontFamily: fonts.sans, border: `4px solid ${INK}` }}>
      {n}
    </div>
  );
}

function Captions() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const beat = frame / t.b(1);
  const top = 290;
  const more = useCounter(WORKS_COUNT - SCENES.length, t.b(T.montage), t.b(2.5));
  if (beat < T.first) {
    const exit = { from: t.b(T.hang) - 4, duration: 10, easing: ease.menuOut };
    return (
      <div style={{ position: "absolute", left: 64, top: top - 10, display: "flex", flexDirection: "column", gap: 18 }}>
        <MaskRise from={4} duration={t.e(1)} exit={exit} style={{ padding: "4px 14px 18px 4px" }}>
          <Sticker size={74}>одна картина</Sticker>
        </MaskRise>
        <MaskRise from={10} duration={t.e(1)} exit={{ ...exit, from: exit.from + 2 }} style={{ padding: "4px 14px 18px 4px" }}>
          <Sticker size={74}>меняет всю комнату</Sticker>
        </MaskRise>
      </div>
    );
  }
  if (beat < T.montage) {
    const k = Math.min(SCENES.length - 1, Math.floor((beat - T.first) / T.per));
    return (
      <div key={k} style={{ position: "absolute", left: 64, top }}>
        <MaskRise from={2} duration={10} exit={{ from: t.b(T.per) - 9, duration: 8, easing: ease.menuOut }} style={{ padding: "4px 14px 18px 4px" }}>
          <Sticker size={54}>
            <Badge n={k + 1} />
            {`«${art(SCENES[k].code).title}»`}
          </Sticker>
        </MaskRise>
      </div>
    );
  }
  if (beat < T.choice) {
    return (
      <div style={{ position: "absolute", left: 64, top }}>
        <MaskRise from={t.b(T.montage) + 2} duration={10} exit={{ from: t.b(T.choice) - 8, duration: 8, easing: ease.menuOut }} style={{ padding: "4px 14px 18px 4px" }}>
          <Sticker size={70}>
            <span style={{ fontVariantNumeric: "tabular-nums", color: bold.accent }}>+{more}</span> картины
          </Sticker>
        </MaskRise>
      </div>
    );
  }
  return null;
}

/** Beats 27–30: the seven as a choice, numbered, «какая твоя?». */
function Choice() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const from = t.b(T.choice);
  const to = t.b(T.logo);
  if (frame < from - 4 || frame >= to + 8) return null;
  const veil = progress(frame, from - 4, 8, ease.out) * (1 - progress(frame, to, 8, ease.in));
  const size = 228;
  const gap = 22;
  const rows = [SCENES.slice(0, 4), SCENES.slice(4)];
  return (
    <AbsoluteFill style={{ opacity: veil }}>
      <AbsoluteFill style={{ background: WHITE, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 64, top: 300, display: "flex", flexDirection: "column", gap: 16 }}>
        <MaskRise from={from} duration={t.e(1)} style={{ padding: "4px 14px 18px 4px" }}>
          <Sticker size={92}>какая твоя?</Sticker>
        </MaskRise>
        <MaskRise from={from + t.s(1)} duration={t.e(1)} style={{ padding: "4px 14px 18px 4px" }}>
          <Sticker size={46} style={{ background: bold.accent, color: WHITE }}>
            пиши номер в комментариях
          </Sticker>
        </MaskRise>
      </div>
      {rows.map((row, r) =>
        row.map((sc, c) => {
          const i = r * 4 + c;
          const p = progress(frame, from + 4 + i * 2, 12, ease.out);
          const w = row.length * size + (row.length - 1) * gap;
          const x = (1080 - w) / 2 + c * (size + gap);
          const y = 700 + r * (size + gap + 20);
          const k = p <= 0 ? 0 : 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
          return (
            <div key={sc.key} style={{ position: "absolute", left: x, top: y, width: size, height: size, scale: String(k), rotate: `${(i % 2 ? 3 : -3) * (1 - p)}deg` }}>
              <div style={{ border: `5px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`, width: size, height: size, overflow: "hidden" }}>
                <ArtImage code={sc.code} width={size - 10} height={size - 10} parentScale={Math.max(1, k)} />
              </div>
              <div style={{ position: "absolute", right: -22, top: -22 }}>
                <Badge n={i + 1} size={62} />
              </div>
            </div>
          );
        }),
      )}
    </AbsoluteFill>
  );
}

/** Beats 30–34: the logo, the site, and the cat under it. */
function EndCard() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const from = t.b(T.logo);
  if (frame < from) return null;
  const f = frame - from;
  const wipe = progress(f, 0, 10, ease.inOut);
  const schedule: LogoSchedule = {
    wave: { from: 6, duration: t.e(1) },
    beads: [t.e(1), t.e(1) + t.s(1), t.b(1)],
    letters: t.e(1) + t.s(1),
    dot: t.b(1) + t.e(1),
    gallery: t.b(1) + t.e(1),
    breath: t.b(3),
  };
  return (
    <AbsoluteFill style={{ clipPath: `circle(${wipe * 1200}px at 540px 900px)`, background: WHITE }}>
      <LogoBuild width={860} x={540} y={760} schedule={schedule} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <MaskRise from={from + t.b(2)} duration={t.e(1)} style={{ padding: "4px 14px 18px 4px" }}>
          <Sticker size={64} style={{ background: bold.accent, color: WHITE }}>
            kuznets.uz
          </Sticker>
        </MaskRise>
        <MaskRise from={from + t.b(2) + t.s(1) + 2} duration={t.e(1)}>
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 38, color: INK, fontVariantNumeric: "tabular-nums" }}>{CONTACTS.phones.map((p) => p.label).join("  ·  ")}</div>
        </MaskRise>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(-150 300)" opacity={progress(f, t.b(2.5), 8, ease.out)}>
          <Cat head={Math.sin(f / 14) * 8} tail={Math.sin(f / 7) * 22} lids={f % 70 < 5 ? 1 : 0} />
        </g>
      </svg>
    </AbsoluteFill>
  );
}
