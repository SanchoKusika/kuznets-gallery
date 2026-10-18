import { evolvePath, getLength, getSubpaths } from "@remotion/paths";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { floorPath, INTERIOR, leftOf, REELS_ROOMS, type Element, type Room } from "../../lines/interiors";
import { pencil } from "../../primitives/LinePath";
import { ease, progress } from "../../theme/easing";
import { useTiming, type Timing } from "../../theme/timing";
import { color, stroke } from "../../theme/tokens";
import { actTimes } from "./hanging";
import { RoomLabel } from "./R2TryOn";

const LINE = { color: color.ink, width: stroke.reels };
const FINE = { color: color.ink3, width: stroke.reels * 0.7 };

/** Share of a room's draw window one element takes; the rest is the left → right stagger. */
const ELEMENT_SPAN = 0.42;

type Prepared = Element & { subs: string[]; lens: number[]; total: number; start: number };

/** Elements with their subpaths measured and their place in the sweep (left first). */
function prepare(room: Room): Prepared[] {
  return room.elements.map((el) => {
    const subs = getSubpaths(el.d);
    const lens = subs.map((s) => getLength(s));
    const start = (1 - ELEMENT_SPAN) * Math.max(0, Math.min(1, leftOf(el.d) / INTERIOR.w));
    return { ...el, subs, lens, total: lens.reduce((a, b) => a + b, 0), start };
  });
}

/** Room windows, frames relative to R3: drawn in (`draw`) and, from its change on, erased (`erase`). */
function roomTimes(t: Timing) {
  const T = actTimes(t);
  const changes = T.changes.map((f) => f - T.r3);
  return REELS_ROOMS.map((_, k) => ({
    draw: k === 0 ? { from: t.s(1), duration: t.b(1.5) } : { from: changes[k - 1] + t.s(1), duration: t.b(1.25) },
    erase: k < changes.length ? { from: changes[k], duration: t.e(1) } : null,
  }));
}

/** One element at drawing progress p (its subpaths one after another, like a pen), alive with its motion. */
function DrawnElement({ el, p, beat }: { el: Prepared; p: number; beat: number }) {
  if (p <= 0) return null;
  const m = el.motion?.(beat) ?? {};
  const s = el.fine ? FINE : LINE;
  const transform = [
    m.dx || m.dy ? `translate(${(m.dx ?? 0).toFixed(2)} ${(m.dy ?? 0).toFixed(2)})` : "",
    m.rotate ? `rotate(${m.rotate.toFixed(3)} ${m.pivot?.[0] ?? 0} ${m.pivot?.[1] ?? 0})` : "",
  ].join(" ");
  let done = 0;
  return (
    <g transform={transform || undefined} opacity={m.opacity}>
      {el.subs.map((d, i) => {
        const len = el.lens[i];
        const q = Math.max(0, Math.min(1, (p * el.total - done) / len));
        done += len;
        if (q <= 0) return null;
        const evo = q < 1 ? evolvePath(q, d) : m.dash ? { strokeDasharray: m.dash.array, strokeDashoffset: -m.dash.offset } : null;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={evo ?? undefined}
          />
        );
      })}
    </g>
  );
}

/**
 * R3 (frames relative to R3): the thread comes in from the left edge as a wave and straightens into the floor; the
 * home is drawn over it in a sweep from left to right, many strokes at once. On each change (with the canvas's spin)
 * the room is wiped out the same way, fast, and the next is drawn in. Drawn things live: plants sway, lamps swing,
 * steam rises, the clock ticks, the cat's tail flicks.
 */
export function R3Interiors() {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const t = useTiming();
  const rooms = useMemo(() => REELS_ROOMS.map(prepare), []);
  const times = roomTimes(t);
  // Beats since the act's start (R1 +0), so the idle motion is one continuous clock.
  const beat = (frame + actTimes(t).r3) / t.b(1);

  const floorP = pencil(progress(frame, 0, t.b(1), ease.out));
  const flat = progress(frame, t.s(1), t.b(1.25), ease.inOut);

  return (
    <>
      <svg width={width} height={INTERIOR.h} viewBox={`0 0 ${INTERIOR.w} ${INTERIOR.h}`} style={{ position: "absolute", left: INTERIOR.x, top: INTERIOR.y, overflow: "visible" }}>
        {floorP > 0 ? (
          <path
            d={floorPath(flat)}
            fill="none"
            stroke={LINE.color}
            strokeWidth={LINE.width}
            strokeLinecap="round"
            style={floorP < 1 ? evolvePath(floorP, floorPath(flat)) : undefined}
          />
        ) : null}
        {rooms.map((room, k) => {
          const { draw, erase } = times[k];
          const drawn = progress(frame, draw.from, draw.duration, ease.linear);
          const erased = erase ? progress(frame, erase.from, erase.duration, ease.linear) : 0;
          if (drawn <= 0 || erased >= 1) return null;
          return (
            <g key={room[0].d.slice(0, 12) + k}>
              {room.map((el, i) => {
                const local = (x: number) => Math.max(0, Math.min(1, (x - el.start) / ELEMENT_SPAN));
                const p = pencil(ease.out(local(drawn))) * (1 - ease.in(local(erased)));
                return <DrawnElement key={i} el={el} p={p} beat={beat} />;
              })}
            </g>
          );
        })}
      </svg>
      <RoomLabel />
    </>
  );
}

/** A room fully drawn and still (styleframes, cover). */
export function RoomStill({ index }: { index: number }) {
  const room = useMemo(() => prepare(REELS_ROOMS[index]), [index]);
  return (
    <svg width={INTERIOR.w} height={INTERIOR.h} style={{ position: "absolute", left: INTERIOR.x, top: INTERIOR.y, overflow: "visible" }}>
      <path d={floorPath(1)} fill="none" stroke={LINE.color} strokeWidth={LINE.width} strokeLinecap="round" />
      {room.map((el, i) => (
        <DrawnElement key={i} el={el} p={1} beat={0} />
      ))}
    </svg>
  );
}
