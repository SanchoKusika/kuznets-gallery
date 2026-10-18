import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { WORKS_COUNT } from "../../data/art";
import { promo } from "../../data/selection";
import { GRID_PROMO, GridWall } from "../../effects/GridWall";
import { SHOWROOM_GRID, SHOWROOM_PHOTOS, showroom } from "../../lines/promo";
import { EASEL_CANVAS, SHOWROOM_SPOTS, showroomElements } from "../../lines/showroom";
import { prepareRoom, RoomStrokes } from "../../primitives/LineRoom";
import { ArtImage } from "../../primitives/ArtImage";
import { useCounter } from "../../primitives/Counter";
import { LineDrawing, pencil } from "../../primitives/LinePath";
import { MaskRise } from "../../primitives/MaskRise";
import { display, serif, tabular } from "../../theme/fonts";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, stroke, type } from "../../theme/tokens";

/** The wall's scale once the camera has pulled back into the showroom (the line drawing is authored at it). */
const PULLED = 0.72;

/** «159 авторских работ», counted up, and «больше их нигде нет» on a paper plate in the middle. */
function Plate({ from, exit }: { from: number; exit: number }) {
  const t = useTiming();
  const n = useCounter(WORKS_COUNT, from, t.b(1));
  const digits = String(WORKS_COUNT).length;
  const words = copy.promo.wallTitle(WORKS_COUNT).slice(digits);
  return (
    <MaskRise
      from={from}
      duration={t.b(1)}
      exit={{ from: exit, duration: t.e(1), easing: ease.inOut, to: "down" }}
      style={{ position: "absolute", left: 960, top: 540, translate: "-50% -50%" }}
      innerStyle={{ background: color.paper, padding: "44px 64px", textAlign: "center", whiteSpace: "nowrap" }}
    >
      <div style={{ ...display(type.promo.large, 600, -0.05), ...tabular, color: color.ink }}>
        <span style={{ display: "inline-block", width: `${digits}ch`, textAlign: "right" }}>{n}</span>
        {words}
      </div>
      <div style={{ ...serif(type.promo.lede), color: color.ink2, marginTop: 16 }}>{copy.promo.wallSub}</div>
    </MaskRise>
  );
}

/** Light from the ceiling spots on the grid wall, switched on one by one once the camera has pulled back. */
function SpotCones({ from }: { from: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  return (
    <>
      {SHOWROOM_SPOTS.map((x, i) => {
        const on = progress(frame, from + i * t.s(1), t.e(1), ease.out);
        if (on <= 0) return null;
        const top = 62;
        const bottom = SHOWROOM_GRID.y + SHOWROOM_GRID.h * 0.8;
        const half = 230;
        return (
          <div
            key={x}
            style={{
              position: "absolute",
              left: x - half,
              top,
              width: 2 * half,
              height: bottom - top,
              opacity: on * 0.85,
              mixBlendMode: "screen",
              clipPath: `polygon(${half - 18}px 0, ${half + 18}px 0, 100% 100%, 0 100%)`,
              background: "radial-gradient(60% 90% at 50% 0%, rgba(255,250,236,.55), rgba(255,250,236,0) 100%)",
            }}
          />
        );
      })}
    </>
  );
}

/**
 * P6 (bar 12): the showroom wall of 66 works fills by a diagonal wave; the counter plate at +¾b; from +2b the camera
 * pulls back (1 → 0.72, 1.25b, in-out) and the wall turns out to be one wall of the showroom drawn in line: a ceiling
 * grille and spots that switch on one by one, a ladder, canvas rolls, frames leaning with small works, kraft boxes,
 * an easel with a canvas, a plant, a frame swinging on the side wall. Frames relative to P6.
 */
export function P6Showroom() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const things = useMemo(() => prepareRoom(showroomElements, 1920), []);
  const pullFrom = t.b(2);
  const pull = progress(frame, pullFrom, t.b(1.25), ease.inOut);
  const s = mix(1, PULLED, pull);
  // The room is authored at the pulled scale: while the camera moves it is scaled with the wall.
  const room = s / PULLED;
  const walls = pencil(progress(frame, pullFrom + t.s(1), t.b(1.25), ease.out));
  const drawn = progress(frame, pullFrom + t.s(2), t.b(1.25), ease.linear);
  const works = progress(frame, pullFrom + t.b(0.75), t.b(0.5), ease.out);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, scale: String(s), transformOrigin: "960px 540px" }}>
        <GridWall codes={promo.wall} layout={GRID_PROMO} step={2} settleDuration={t.bar(1)} parentScale={s} />
      </div>
      {walls > 0 ? (
        <div style={{ position: "absolute", inset: 0, scale: String(room), transformOrigin: "960px 540px" }}>
          <SpotCones from={pullFrom + t.b(1.25)} />
          <LineDrawing art={showroom} progress={walls} x={0} y={0} color={color.ink} width={stroke.promo / room} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <RoomStrokes
              room={things}
              drawn={drawn}
              beat={frame / t.b(1)}
              line={{ color: color.ink, width: stroke.promo / room }}
              fine={{ color: color.ink3, width: (stroke.promo * 0.7) / room }}
            />
          </svg>
          {SHOWROOM_PHOTOS.map((p) => (
            <div key={p.code} style={{ position: "absolute", left: p.x, top: p.y, opacity: works }}>
              <ArtImage code={p.code} width={p.w} height={p.h} parentScale={room} />
            </div>
          ))}
          <div style={{ position: "absolute", left: EASEL_CANVAS.x, top: EASEL_CANVAS.y, opacity: works, boxShadow: "0 10px 18px -8px rgba(21,21,21,.35)" }}>
            <ArtImage code={promo.easel} width={EASEL_CANVAS.w} height={EASEL_CANVAS.h} parentScale={room} />
          </div>
        </div>
      ) : null}
      <Plate from={t.b(0.75)} exit={pullFrom} />
    </>
  );
}
