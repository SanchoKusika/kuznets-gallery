import type { ReactNode } from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { HALL, LIGHT_FRAMES_LAYOUT, lightFrames, MOON_STARS_AT, moonStars, plantA, plantB } from "../../lines/promo";
import type { LineArt } from "../../lines/types";
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
import { P4Ribbon } from "./P4Ribbon";

/** P1's accent dot: in the middle of the empty centre frame. */
const DOT = { x: 960, y: 540, d: 24 };

/** The floor of the whole wall (world px; the halls stand on it) and a gallery bench in P1, under the centre frame. */
const FLOOR_Y = HALL.interior.y + HALL.interior.floorY;
const galleryFloor: LineArt = {
  w: 1920,
  h: 1080,
  parts: [
    `M-40 ${FLOOR_Y}H${hallX(4) + 1920 * 2}`,
    `M770 ${FLOOR_Y - 92}H1150Q1158 ${FLOOR_Y - 92} 1158 ${FLOOR_Y - 84}V${FLOOR_Y - 74}Q1158 ${FLOOR_Y - 66} 1150 ${FLOOR_Y - 66}H770Q762 ${FLOOR_Y - 66} 762 ${FLOOR_Y - 74}V${FLOOR_Y - 84}Q762 ${FLOOR_Y - 92} 770 ${FLOOR_Y - 92}` +
      `M800 ${FLOOR_Y - 66}V${FLOOR_Y}M1120 ${FLOOR_Y - 66}V${FLOOR_Y}M800 ${FLOOR_Y - 30}H1120`,
  ],
};

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

/** P1 frames and moon: drawn on in the dark (pencil), shown finished in the light. */
function FramesLines({ lineColor, opacity, drawn }: { lineColor: string; opacity: number; drawn: number }) {
  const t = useTiming();
  const frame = useCurrentFrame();
  const framesP = drawn >= 1 ? 1 : pencil(progress(frame, t.s(1), t.b(2), ease.out));
  const moonP = drawn >= 1 ? 1 : pencil(progress(frame, t.b(1), t.b(1.5), ease.out));
  const floorP = drawn >= 1 ? 1 : pencil(progress(frame, 0, t.b(1.5), ease.out));
  const line = { color: lineColor, width: stroke.promo, opacity };
  return (
    <>
      <LineDrawing art={galleryFloor} progress={floorP} x={0} y={0} {...line} />
      <LineDrawing art={lightFrames} progress={framesP} x={0} y={0} {...line} />
      <LineDrawing art={moonStars} progress={moonP} x={MOON_STARS_AT.x} y={MOON_STARS_AT.y} {...line} />
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
      <Layer speed={LAYER.wall}>
        <FramesLines lineColor={color.ink} opacity={1} drawn={1} />
        <FramedWorks />
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
          <Layer speed={LAYER.wall}>
            <FramesLines lineColor={dark.line} opacity={0.35} drawn={0} />
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
