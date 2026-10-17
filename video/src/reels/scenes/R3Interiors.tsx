import { getLength, getPointAtLength } from "@remotion/paths";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { INTERIOR, REELS_INTERIORS } from "../../lines/reels";
import { LineDrawing, LinePath, MorphLines, pencil, threadPath } from "../../primitives/LinePath";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, stroke } from "../../theme/tokens";
import { actTimes } from "./hanging";
import { RoomLabel } from "./R2TryOn";

/** Where the thread enters from the left edge (brief R3: y ≈ 1300). */
const THREAD_Y = 1300;

const ink = { color: color.ink, width: stroke.reels };

/**
 * R3 (frames relative to R3): the thread enters from the left and draws the home interior (1.5b); on each change the
 * drawing morphs into the next interior (1b, in-out) while the thread is pulled into the drawing. Labels change too.
 */
export function R3Interiors() {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const t = useTiming();
  const T = actTimes(t);
  const changes = T.changes.map((f) => f - T.r3);
  const home = REELS_INTERIORS[0];

  const plan = useMemo(() => {
    const p0 = getPointAtLength(home.parts[0], 0) ?? { x: 0, y: 0 };
    const d = threadPath({ x: -20, y: THREAD_Y }, { x: INTERIOR.x + p0.x, y: INTERIOR.y + p0.y });
    const art = home.parts.reduce((s, part) => s + getLength(part), 0);
    return { d, thread: getLength(d), art };
  }, [home]);

  // One pencil stroke over thread + drawing, split by length (as LineDrawing's own thread, but kept separate so the
  // thread can be pulled in before the morph).
  const drawn = pencil(progress(frame, 0, t.b(1.5), ease.out)) * (plan.thread + plan.art);
  const threadP = Math.min(1, drawn / plan.thread);
  const artP = Math.max(0, Math.min(1, (drawn - plan.thread) / plan.art));
  const pulled = progress(frame, changes[0], T.change, ease.inOut);

  let k = 0;
  changes.forEach((at, i) => {
    if (frame >= at) k = i + 1;
  });
  const morph = k > 0 ? progress(frame, changes[k - 1], T.change, ease.inOut) : 0;

  return (
    <>
      {pulled < 1 && threadP > 0 ? (
        <svg width={width} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {pulled > 0 ? (
            <path
              d={plan.d}
              style={{
                fill: "none",
                stroke: ink.color,
                strokeWidth: ink.width,
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeDasharray: `${plan.thread} ${plan.thread}`,
                strokeDashoffset: -pulled * plan.thread,
              }}
            />
          ) : (
            <LinePath d={plan.d} progress={threadP} {...ink} />
          )}
        </svg>
      ) : null}
      {k === 0 ? (
        <LineDrawing art={home} progress={artP} x={INTERIOR.x} y={INTERIOR.y} {...ink} />
      ) : (
        <MorphLines from={REELS_INTERIORS[k - 1]} to={REELS_INTERIORS[k]} t={morph} x={INTERIOR.x} y={INTERIOR.y} {...ink} />
      )}
      <RoomLabel />
    </>
  );
}
