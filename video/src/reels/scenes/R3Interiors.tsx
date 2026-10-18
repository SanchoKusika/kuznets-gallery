import { evolvePath } from "@remotion/paths";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { floorPath, INTERIOR, REELS_ROOMS } from "../../lines/interiors";
import { pencil } from "../../primitives/LinePath";
import { prepareRoom, RoomStrokes } from "../../primitives/LineRoom";
import { ease, progress } from "../../theme/easing";
import { useTiming, type Timing } from "../../theme/timing";
import { color, stroke } from "../../theme/tokens";
import { actTimes } from "./hanging";
import { RoomLabel } from "./R2TryOn";

const LINE = { color: color.ink, width: stroke.reels };
const FINE = { color: color.ink3, width: stroke.reels * 0.7 };

/** Room windows, frames relative to R3: drawn in (`draw`) and, from its change on, erased (`erase`). */
function roomTimes(t: Timing) {
  const T = actTimes(t);
  const changes = T.changes.map((f) => f - T.r3);
  return REELS_ROOMS.map((_, k) => ({
    draw: k === 0 ? { from: t.s(1), duration: t.b(1.5) } : { from: changes[k - 1] + t.s(1), duration: t.b(1.25) },
    erase: k < changes.length ? { from: changes[k], duration: t.e(1) } : null,
  }));
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
  const rooms = useMemo(() => REELS_ROOMS.map((r) => prepareRoom(r.elements, INTERIOR.w)), []);
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
          return <RoomStrokes key={k} room={room} drawn={drawn} erased={erased} beat={beat} line={LINE} fine={FINE} />;
        })}
      </svg>
      <RoomLabel />
    </>
  );
}

/** A room fully drawn and still (styleframes, cover). */
export function RoomStill({ index }: { index: number }) {
  const room = useMemo(() => prepareRoom(REELS_ROOMS[index].elements, INTERIOR.w), [index]);
  return (
    <svg width={INTERIOR.w} height={INTERIOR.h} style={{ position: "absolute", left: INTERIOR.x, top: INTERIOR.y, overflow: "visible" }}>
      <path d={floorPath(1)} fill="none" stroke={LINE.color} strokeWidth={LINE.width} strokeLinecap="round" />
      <RoomStrokes room={room} drawn={1} beat={0} line={LINE} fine={FINE} />
    </svg>
  );
}
