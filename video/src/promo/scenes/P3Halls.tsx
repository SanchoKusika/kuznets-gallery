import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CATALOG } from "../../data/art";
import { copy } from "../../data/copy";
import { promo } from "../../data/selection";
import { formatPrice } from "../../data/typo";
import { BagetFrame, GlassFrame } from "../../effects/Framing";
import { hallLabel, hallWorkRect, HALL } from "../../lines/promo";
import { PROMO_ROOM, PROMO_ROOMS } from "../../lines/promoRooms";
import { ArtImage } from "../../primitives/ArtImage";
import { DotCursor } from "../../primitives/DotCursor";
import { prepareRoom, RoomStrokes } from "../../primitives/LineRoom";
import { MaskRise } from "../../primitives/MaskRise";
import { chipCenter, chipWidth, LABEL_CHIP, LABEL_LINE_TOP, MuseumLabel } from "../../primitives/MuseumLabel";
import { display } from "../../theme/fonts";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, stroke, type } from "../../theme/tokens";
import { cameraX, hallX, sceneStarts } from "../layout";

const LINE = { color: color.ink, width: stroke.promo };
const FINE = { color: color.ink3, width: stroke.promo * 0.7 };

/** The hall's work that shows a choice, and which (brief: the cursor's hover in halls 1 and 3). */
const CHOICE: Record<number, "size" | "frame"> = { 0: "size", 2: "frame" };
const FRAME_OPTIONS = ["холст", "багет", "стекло"];
/** Side of the work on screen for each size chip (its real sizes grow, the picture grows with them). */
const SIZE_PX = [320, 360, 400];

/**
 * The site's switch shown with its cursor (in place of the brief's «смотреть» hover): the dot comes to the chips in
 * the label and clicks the second option at +2b and the third at +2.75b, then leaves. Returns the chosen option
 * (fractional while it changes), the cursor and its click pulse.
 */
function useChoice(h: number, label: { x: number; y: number }, line: "size" | "frame", options: string[]) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const clicks = [h + t.b(2), h + t.b(2.75)];
  const active = clicks.reduce((a, c) => a + progress(frame, c, t.s(1), ease.out), 0);
  // The cursor clicks the chip's lower right, so its text stays readable under the dot.
  const chip = (i: number) => ({ x: chipCenter(options, i, label.x) + chipWidth(options[i]) * 0.38, y: label.y + LABEL_LINE_TOP[line] + LABEL_CHIP.h * 0.85 });
  const away = { x: label.x + 420, y: label.y + 420 };
  const come = progress(frame, h + t.b(1.6), t.b(0.35), ease.menuIn);
  const hop = progress(frame, h + t.b(2.3), t.b(0.4), ease.inOut);
  const leave = progress(frame, h + t.b(3.25), t.e(1), ease.in);
  const c1 = chip(1);
  const c2 = chip(2);
  const x = mix(mix(mix(away.x, c1.x, come), c2.x, hop), away.x, leave);
  const y = mix(mix(mix(away.y, c1.y, come), c2.y, hop), away.y, leave);
  const pulse = clicks.reduce((p, c) => p * (1 - 0.3 * Math.sin(Math.PI * progress(frame, c, t.s(0.75), ease.linear))), 1);
  return { active, cursor: { x, y, shown: come * (1 - leave), pulse } };
}

/** The work of the frame choice: canvas → baguette (four bars snap in) → paper under glass, cross-faded. */
function FramedChoice({ code, r, active, from }: { code: string; r: { x: number; y: number; w: number; h: number }; active: number; from: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const bar = 28;
  const bars = [0, 1, 2, 3].map((i) => progress(frame, from + i * t.s(0.5), t.s(1), ease.menuIn));
  const wCanvas = Math.max(0, 1 - active);
  const wBaget = Math.max(0, 1 - Math.abs(active - 1));
  const wGlass = Math.max(0, active - 1);
  return (
    <>
      {wCanvas > 0 ? (
        <div style={{ position: "absolute", left: r.x, top: r.y, opacity: wCanvas }}>
          <ArtImage code={code} width={r.w} height={r.h} shadow />
        </div>
      ) : null}
      {wBaget > 0 ? (
        <div style={{ position: "absolute", left: r.x, top: r.y, opacity: wBaget }}>
          <BagetFrame code={code} w={r.w - 2 * bar} h={r.h - 2 * bar} bar={bar} bars={bars} travel={120} />
        </div>
      ) : null}
      {wGlass > 0 ? (
        <div style={{ position: "absolute", left: r.x, top: r.y, opacity: wGlass }}>
          <GlassFrame code={code} w={r.w} h={r.h} />
        </div>
      ) : null}
    </>
  );
}

function Hall({ k }: { k: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const S = sceneStarts(t);
  const h = S.P3 + k * t.bar(1);
  const hall = promo.halls[k];
  const room = useMemo(() => prepareRoom(PROMO_ROOMS[k], PROMO_ROOM.w), [k]);
  const kind = CHOICE[k];
  const label0 = hallLabel(0);
  const sizes = kind === "size" ? sizesOf(hall.codes[0]) : [];
  const options = kind === "size" ? sizes.map((z) => `${z.w}×${z.h}`) : FRAME_OPTIONS;
  const choice = useChoice(h, label0, kind ?? "size", options);
  const drawn = progress(frame, h + t.e(1), t.b(1.5), ease.linear);
  return (
    <div style={{ position: "absolute", left: hallX(k), top: 0, width: HALL.width, height: 1080 }}>
      <svg width={PROMO_ROOM.w} height={PROMO_ROOM.h} style={{ position: "absolute", left: 0, top: PROMO_ROOM.y, overflow: "visible" }}>
        <RoomStrokes room={room} drawn={drawn} beat={frame / t.b(1)} line={LINE} fine={FINE} />
      </svg>
      <div style={{ position: "absolute", left: 160, top: 64 }}>
        <MaskRise from={h + t.b(0.75)} duration={t.b(1.5)} innerStyle={{ paddingBottom: 24 }}>
          <div style={{ ...display(type.promo.large, 500, -0.05), color: color.ink }}>{copy.promo.halls[k]}</div>
        </MaskRise>
      </div>
      {hall.codes.map((code, i) => {
        const r = hallWorkRect(i);
        const l = hallLabel(i);
        const chosen = kind && i === 0;
        const from = h + t.b(1.25) + i * t.s(1);
        if (chosen && kind === "size") {
          // The work grows with the chosen size, its right edge (and the label) staying put.
          const side = interpolate(choice.active, [0, 1, 2], SIZE_PX);
          const k2 = Math.round(choice.active);
          return (
            <div key={code}>
              <div style={{ position: "absolute", left: r.x + r.w - side, top: r.y + r.h / 2 - side / 2 }}>
                <ArtImage code={code} width={side} height={side} shadow />
              </div>
              <MuseumLabel
                code={code}
                from={from}
                step={t.s(0.25)}
                x={l.x}
                y={l.y}
                style={{ width: l.w }}
                choice={{ line: "size", options, active: choice.active }}
                price={formatPrice(sizes[k2].price)}
              />
            </div>
          );
        }
        return (
          <div key={code}>
            {chosen ? (
              <FramedChoice code={code} r={r} active={choice.active} from={h + t.b(2)} />
            ) : (
              <div style={{ position: "absolute", left: r.x, top: r.y }}>
                <ArtImage code={code} width={r.w} height={r.h} shadow />
              </div>
            )}
            <MuseumLabel
              code={code}
              from={from}
              step={t.s(0.25)}
              x={l.x}
              y={l.y}
              style={{ width: l.w }}
              choice={chosen ? { line: "frame", options: FRAME_OPTIONS, active: choice.active } : undefined}
            />
          </div>
        );
      })}
      {kind && choice.cursor.shown > 0 ? (
        <DotCursor x={choice.cursor.x} y={choice.cursor.y} d={22 * choice.cursor.shown * choice.cursor.pulse} />
      ) : null}
    </div>
  );
}

/** The first three priced sizes of a work from 50 cm (the choice in hall 1). */
function sizesOf(code: string) {
  const item = CATALOG.find((c) => c.code === code);
  const priced = (item?.sizes ?? []).filter((z): z is { w: number; h: number; price: number } => z.price != null && z.w >= 50);
  return priced.sort((a, b) => a.price - b.price).slice(0, 3);
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
