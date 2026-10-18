import type { ReactNode } from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";
import { galleryElements, rope, SPOTS, STANCHIONS } from "../../lines/gallery";
import { LIGHT_FRAMES_LAYOUT, lightFrames, plantA, plantB } from "../../lines/promo";
import { prepareRoom, RoomStrokes } from "../../primitives/LineRoom";
import { art } from "../../data/art";
import { promo } from "../../data/selection";
import { ArtImage } from "../../primitives/ArtImage";
import { CircleReveal, coverRadius } from "../../primitives/CircleReveal";
import { LineDrawing, pencil } from "../../primitives/LinePath";
import { Wall } from "../../primitives/Wall";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, dark, stroke } from "../../theme/tokens";
import { cameraX, hallX, LAYER, sceneStarts, worldZoom } from "../layout";
import { P2Hero } from "./P2Hero";
import { P3Halls } from "./P3Halls";
import { FloorPlane } from "./FloorPlane";
import { P4Ribbon } from "./P4Ribbon";

/** P1's accent dot: in the middle of the empty centre frame. */
const DOT = { x: 960, y: 540, d: 24 };

/** A layer of the world moving at `speed` × the camera, zoomed about the screen centre with the world. */
function Layer({ speed, children }: { speed: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const x = cameraX(frame, t) * speed;
  const z = worldZoom(frame, t);
  return (
    <AbsoluteFill style={{ scale: String(z), transformOrigin: "960px 540px" }}>
      <AbsoluteFill style={{ translate: `${-x}px 0` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}

/**
 * P1's gallery: frames, the spots, the bench and the stanchions — drawn on in the dark (pencil), finished
 * in the light. The ropes sag and sway a little.
 */
function GalleryLines({ lineColor, paper, opacity, drawn }: { lineColor: string; paper: string; opacity: number; drawn: number }) {
  const t = useTiming();
  const frame = useCurrentFrame();
  const gallery = useMemo(() => prepareRoom(galleryElements, 1920), []);
  const framesP = drawn >= 1 ? 1 : pencil(progress(frame, t.s(1), t.b(2), ease.out));
  const roomP = drawn >= 1 ? 1 : progress(frame, t.e(1), t.b(2), ease.linear);
  const line = { color: lineColor, width: stroke.promo, opacity };
  const sag = (i: number) => 34 + 3 * Math.sin((2 * Math.PI * frame) / t.b(3) + i);
  return (
    <>
      <LineDrawing art={lightFrames} progress={framesP} x={0} y={0} {...line} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
        {roomP >= 0.6
          ? STANCHIONS.map(([a, b], i) => (
              <path key={i} d={rope(a, b, sag(i))} fill="none" stroke={lineColor} strokeWidth={stroke.promo * 1.6} strokeLinecap="round" />
            ))
          : null}
        <RoomStrokes room={gallery} drawn={roomP} beat={frame / t.b(1)} line={line} fine={{ ...line, width: stroke.promo * 0.7 }} paper={paper} />
      </svg>
    </>
  );
}

/** Light from the spots on the wall around each frame: switched on one by one after the light comes on. */
function SpotLight() {
  const frame = useCurrentFrame();
  const t = useTiming();
  return (
    <>
      {SPOTS.map((s, i) => {
        const on = progress(frame, t.b(6) + i * t.e(1) * 0.5, t.e(1), ease.out);
        if (on <= 0) return null;
        const top = 58;
        const bottom = s.frame.y + s.frame.h + 90;
        const half = s.frame.w / 2 + 70;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x - half,
              top,
              width: 2 * half,
              height: bottom - top,
              opacity: on,
              clipPath: `polygon(${half - 20}px 0, ${half + 20}px 0, 100% 100%, 0 100%)`,
              background: "radial-gradient(70% 85% at 50% 0%, rgba(255,251,240,.75), rgba(255,251,240,0) 100%)",
            }}
          />
        );
      })}
    </>
  );
}

/** The five works in P1's frames (light side only). */
function FramedWorks() {
  return (
    <>
      {LIGHT_FRAMES_LAYOUT.map((f) => (
        <div key={f.code} style={{ position: "absolute", left: f.x, top: f.y }}>
          <ArtImage code={f.code} width={f.w} height={f.h} shadow />
        </div>
      ))}
    </>
  );
}

/**
 * P2: canvases waiting to be hung, leaning on the wall in pairs along the floor under «картины» (wall layer, so
 * they pass under the slower text). Each leans back a little (its top recedes) and throws a soft shadow on the wall.
 */
function LeaningWorks() {
  const groups = [2140, 2660, 3120];
  return (
    <>
      {groups.map((cx, g) =>
        [0, 1].map((k) => {
          const code = promo.leaning[g * 2 + k];
          const a = art(code);
          const h = k === 0 ? 196 : 150;
          const w = Math.round((h * a.w) / a.h);
          const bottom = k === 0 ? 976 : 990;
          const x = cx + (k === 0 ? -w / 2 - 40 : 10 - w / 2 + 70);
          return (
            <div
              key={code}
              style={{
                position: "absolute",
                left: x,
                top: bottom - h,
                width: w,
                height: h,
                transformOrigin: "50% 100%",
                transform: "perspective(1400px) rotateX(9deg)",
                boxShadow: "8px -2px 26px -6px rgba(21,21,21,.3)",
              }}
            >
              <ArtImage code={code} width={w} height={h} />
            </div>
          );
        }),
      )}
    </>
  );
}

/** Foreground plants (1.4×): one passes during P2's glide and one during each flight between halls. */
function Plants() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const line = { color: color.ink, width: stroke.promo };
  // World x (plants layer) where a plant crosses the screen centre when the camera is at `camX`.
  const at = (camX: number, w: number) => 960 + LAYER.plants * camX - w / 2;
  const items = [
    { art: plantB, x: at(750, plantB.w) },
    { art: plantA, x: at(hallX(0) + 987, plantA.w) },
    { art: plantB, x: at(hallX(1) + 987, plantB.w) },
    { art: plantA, x: at(hallX(2) + 987, plantA.w) },
  ];
  const sway = 1.5 * Math.sin((2 * Math.PI * frame) / t.b(3));
  return (
    <>
      {items.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: p.x, top: 1080 - p.art.h + 40, rotate: `${sway * (i % 2 ? -1 : 1)}deg`, transformOrigin: "50% 100%" }}>
          <LineDrawing art={p.art} progress={1} x={0} y={0} {...line} />
        </div>
      ))}
    </>
  );
}

/**
 * P1–P4 on one long wall (brief 8): the dark gallery with empty frames, the light coming on from the dot, the hero
 * word, the four halls and the ribbon — one camera (`cameraX`) over layers of the world. Absolute frames.
 */
export function ActWorld() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = useTiming();
  const S = sceneStarts(t);

  // P1: the dot lights at +2.5b, breathes at +3b, and at +4b a circle from it turns the light on (1.75b, in-out).
  const dotIn = progress(frame, t.b(2.5), t.e(1), ease.out);
  const breath = Math.sin(Math.PI * progress(frame, t.b(3), t.b(1), ease.inOut)) * 0.15;
  const reveal = progress(frame, t.b(4), t.b(1.75), ease.inOut);
  const radius = mix((DOT.d / 2) * (1 + breath), coverRadius(DOT.x, DOT.y, width, height), reveal);
  const lit = frame >= t.b(4);
  const fullyLit = reveal >= 1;
  const whip = frame >= S.P4 + t.b(2) - 1 && frame <= S.P4 + t.b(2.75) + 1;

  const light = (
    <>
      <Wall />
      <FloorPlane />
      <Layer speed={LAYER.wall}>
        <SpotLight />
        <GalleryLines lineColor={color.ink} paper={color.paper} opacity={1} drawn={1} />
        <FramedWorks />
        <LeaningWorks />
        <P3Halls />
      </Layer>
      <Layer speed={LAYER.text}>
        <P2Hero />
      </Layer>
      <Layer speed={LAYER.plants}>
        <Plants />
      </Layer>
    </>
  );

  return (
    <AbsoluteFill>
      {!fullyLit ? (
        <AbsoluteFill style={{ backgroundColor: dark.paper }}>
          <Wall theme="dark" />
          <FloorPlane theme="dark" opacity={progress(frame, 0, t.b(1.5), ease.out)} />
          <Layer speed={LAYER.wall}>
            <GalleryLines lineColor={dark.line} paper={dark.paper} opacity={0.35} drawn={0} />
          </Layer>
        </AbsoluteFill>
      ) : null}
      {lit ? (
        <CircleReveal x={DOT.x} y={DOT.y} radius={radius}>
          {/* The whip after the ribbon is the one camera move with motion blur (brief P4). */}
          {whip ? (
            <CameraMotionBlur shutterAngle={180} samples={8}>
              {light}
            </CameraMotionBlur>
          ) : (
            light
          )}
        </CircleReveal>
      ) : null}
      {dotIn > 0 && !lit ? (
        <div
          style={{
            position: "absolute",
            left: DOT.x - DOT.d / 2,
            top: DOT.y - DOT.d / 2,
            width: DOT.d,
            height: DOT.d,
            borderRadius: "50%",
            background: color.accent,
            scale: String(dotIn * (1 + breath)),
          }}
        />
      ) : null}
      {frame >= S.P4 ? <P4Ribbon /> : null}
    </AbsoluteFill>
  );
}
