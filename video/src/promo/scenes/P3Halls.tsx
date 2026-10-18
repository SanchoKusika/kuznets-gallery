import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { promo } from "../../data/selection";
import { hallLabel, hallWorkRect, HALL } from "../../lines/promo";
import { PROMO_ROOM, PROMO_ROOMS } from "../../lines/promoRooms";
import { ArtImage } from "../../primitives/ArtImage";
import { DotCursor } from "../../primitives/DotCursor";
import { prepareRoom, RoomStrokes } from "../../primitives/LineRoom";
import { MaskRise } from "../../primitives/MaskRise";
import { MuseumLabel } from "../../primitives/MuseumLabel";
import { display } from "../../theme/fonts";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, stroke, type } from "../../theme/tokens";
import { cameraX, hallX, sceneStarts } from "../layout";

const LINE = { color: color.ink, width: stroke.promo };
const FINE = { color: color.ink3, width: stroke.promo * 0.7 };

/**
 * The hover of the site's cursor (brief P3, halls 1 and 3, on +2b): the dot flies in from the lower right and grows
 * to ⌀ 150 with «смотреть» while the work comes 1.05× closer (1b, ease-out); from +3.25b everything goes back.
 */
function useHover(h: number) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const come = progress(frame, h + t.b(2), t.e(1), ease.menuIn);
  const back = progress(frame, h + t.b(3.25), t.e(1), ease.inOut);
  return {
    dot: come * (1 - back),
    zoom: 1 + 0.05 * progress(frame, h + t.b(2), t.b(1), ease.out) * (1 - back),
    label: progress(frame, h + t.b(2) + t.s(1), t.s(1), ease.linear) * (1 - progress(frame, h + t.b(3.25), t.s(1), ease.linear)),
  };
}

function Hall({ k }: { k: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const S = sceneStarts(t);
  const h = S.P3 + k * t.bar(1);
  const hall = promo.halls[k];
  const room = useMemo(() => prepareRoom(PROMO_ROOMS[k], PROMO_ROOM.w), [k]);
  const hover = useHover(h);
  const drawn = progress(frame, h + t.e(1), t.b(1.5), ease.linear);
  return (
    <div style={{ position: "absolute", left: hallX(k), top: 0, width: HALL.width, height: 1080 }}>
      <svg width={PROMO_ROOM.w} height={PROMO_ROOM.h} style={{ position: "absolute", left: 0, top: PROMO_ROOM.y, overflow: "visible" }}>
        <RoomStrokes room={room} drawn={drawn} beat={frame / t.b(1)} line={LINE} fine={FINE} />
      </svg>
      <div style={{ position: "absolute", left: 160, top: 64 }}>
        <MaskRise from={h + t.b(0.75)} duration={t.b(1.5)} style={{ paddingBottom: 24 }}>
          <div style={{ ...display(type.promo.large, 500, -0.05), color: color.ink }}>{copy.promo.halls[k]}</div>
        </MaskRise>
      </div>
      {hall.codes.map((code, i) => {
        const r = hallWorkRect(i);
        const l = hallLabel(i);
        const z = code === hall.hover ? hover.zoom : 1;
        return (
          <div key={code}>
            <div style={{ position: "absolute", left: r.x, top: r.y, scale: z === 1 ? undefined : String(z) }}>
              <ArtImage code={code} width={r.w} height={r.h} shadow parentScale={z} />
            </div>
            <MuseumLabel code={code} from={h + t.b(1.25) + i * t.s(1)} step={t.s(0.25)} x={l.x} y={l.y} style={{ width: l.w }} />
            {code === hall.hover && hover.dot > 0 ? (
              <DotCursor
                x={mix(r.x + r.w + 420, r.x + r.w / 2 + 30, hover.dot)}
                y={mix(r.y + r.h + 380, r.y + r.h / 2 + 20, hover.dot)}
                d={150 * hover.dot}
                label={copy.promo.hover}
                labelOpacity={hover.label}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** P3 (bars 5–8): four halls side by side on the wall; each is drawn as the camera arrives. Absolute frames. */
export function P3Halls() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const x = cameraX(frame, t);
  return (
    <>
      {[0, 1, 2, 3].map((k) => (Math.abs(hallX(k) - x) < 1920 + 400 ? <Hall key={k} k={k} /> : null))}
    </>
  );
}
