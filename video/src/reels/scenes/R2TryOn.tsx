import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { art } from "../../data/art";
import { copy } from "../../data/copy";
import { reels } from "../../data/selection";
import { Chip } from "../../primitives/Chip";
import { ease, progress } from "../../theme/easing";
import { label } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { color } from "../../theme/tokens";
import { actTimes } from "./hanging";

export type TickerItem = { node: ReactNode; at: number; duration: number };

// The mask is a few px taller than the content so the chip's 1 px outline is not cut.
const PAD = 4;

/**
 * A caption that changes like the works in the frame (rise from the mask): the new one rises from below while the
 * previous leaves up, both inside one mask; centred horizontally at `top`. Items in order, act frames.
 */
export function Ticker({ items, top, style }: { items: TickerItem[]; top: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  let i = -1;
  while (i + 1 < items.length && frame >= items[i + 1].at) i++;
  if (i < 0) return null;
  const p = progress(frame, items[i].at, items[i].duration, ease.rise);
  const layers = p < 1 && i > 0 ? [i - 1, i] : [i];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: top - PAD, display: "flex", justifyContent: "center", ...style }}>
      <div style={{ display: "grid", justifyItems: "center", overflow: "hidden", padding: `${PAD}px ${PAD * 4}px` }}>
        {layers.map((k) => (
          <div key={k} style={{ gridArea: "1 / 1", translate: `0 ${k === i ? (1 - p) * 110 : -p * 110}%` }}>
            {items[k].node}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Chip over the frame, R2 → R3: the current work's title (brief R2: y ≈ 410). */
export const CHIP_TOP = 386;
/** R3 label (ДЛЯ ДОМА…), y ≈ 330. */
export const LABEL_TOP = 318;

/** Chip with the title of the work in the frame: appears once the hook has left, then changes with every work. */
export function WorkChip() {
  const t = useTiming();
  const T = actTimes(t);
  const tryOn = reels.tryOn.map((code, i) => ({ code, at: i === 0 ? T.r2 + T.hook.exitDuration : T.r2 + t.b(i), duration: T.swap }));
  const rooms = reels.interiors.slice(1).map((r, k) => ({ code: r.code, at: T.changes[k], duration: T.change }));
  const items = [...tryOn, ...rooms].map((x) => ({ ...x, node: <Chip>{art(x.code).title}</Chip> }));
  return <Ticker items={items} top={CHIP_TOP} />;
}

/** R3 labels, one per interior; frames relative to R3. */
export function RoomLabel() {
  const t = useTiming();
  const T = actTimes(t);
  const items = reels.interiors.map((r, k) => ({
    at: k === 0 ? 0 : T.changes[k - 1] - T.r3,
    duration: T.change,
    node: <div style={{ ...label(26), color: color.ink2, whiteSpace: "nowrap" }}>{copy.reels.labels[r.key]}</div>,
  }));
  return <Ticker items={items} top={LABEL_TOP} />;
}
