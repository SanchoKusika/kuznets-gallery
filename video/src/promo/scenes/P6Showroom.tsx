import { useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { WORKS_COUNT } from "../../data/art";
import { promo } from "../../data/selection";
import { GRID_PROMO, GridWall } from "../../effects/GridWall";
import { SHOWROOM_PHOTOS, showroom } from "../../lines/promo";
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
  const n = useCounter(WORKS_COUNT, from, t.b(1.5));
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

/**
 * P6 (bar 12): the showroom wall of 66 works fills by a diagonal wave; the counter plate at +1b; from +2.25b the
 * camera pulls back (1 → 0.72, 1.5b, in-out) and the wall turns out to be one wall of the showroom drawn in line —
 * ceiling grille, spots, floor, frames leaning on it with small works inside. Frames relative to P6.
 */
export function P6Showroom() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const pullFrom = t.b(2.25);
  const pull = progress(frame, pullFrom, t.b(1.5), ease.inOut);
  const s = mix(1, PULLED, pull);
  // The room is authored at the pulled scale: while the camera moves it is scaled with the wall.
  const room = s / PULLED;
  const drawn = pencil(progress(frame, pullFrom + t.s(1), t.b(1.5), ease.out));
  const photos = progress(frame, pullFrom + t.b(0.75), t.b(0.75), ease.out);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, scale: String(s), transformOrigin: "960px 540px" }}>
        <GridWall codes={promo.wall} layout={GRID_PROMO} step={2} settleDuration={t.bar(1)} parentScale={s} />
      </div>
      {drawn > 0 ? (
        <div style={{ position: "absolute", inset: 0, scale: String(room), transformOrigin: "960px 540px" }}>
          <LineDrawing art={showroom} progress={drawn} x={0} y={0} color={color.ink} width={stroke.promo / room} />
          {SHOWROOM_PHOTOS.map((p) => (
            <div key={p.code} style={{ position: "absolute", left: p.x, top: p.y, opacity: photos }}>
              <ArtImage code={p.code} width={p.w} height={p.h} parentScale={room} />
            </div>
          ))}
        </div>
      ) : null}
      <Plate from={t.b(1)} exit={pullFrom} />
    </>
  );
}
