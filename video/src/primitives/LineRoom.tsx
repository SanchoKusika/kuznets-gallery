import { evolvePath, getLength, getSubpaths } from "@remotion/paths";
import type { Element } from "../lines/shapes";
import { pencil } from "./LinePath";
import { ease } from "../theme/easing";
import { color } from "../theme/tokens";

export type LineStyle = { color: string; width: number };

/** Share of a room's draw window one element takes; the rest is the left → right stagger. */
const ELEMENT_SPAN = 0.42;

export type PreparedElement = Element & { subs: string[]; lens: number[]; total: number; start: number };

/** Leftmost x of a path (the sweep order). */
export function leftOf(d: string) {
  const xs = [...d.matchAll(/[ML]\s*(-?[\d.]+)/g)].map((m) => Number(m[1]));
  return xs.length ? Math.min(...xs) : 0;
}

/** Elements with their subpaths measured and their place in the sweep across a box `width` wide (left first). */
export function prepareRoom(elements: readonly Element[], width: number): PreparedElement[] {
  return elements.map((el) => {
    const subs = getSubpaths(el.d);
    const lens = subs.map((s) => getLength(s));
    const start = (1 - ELEMENT_SPAN) * Math.max(0, Math.min(1, leftOf(el.d) / width));
    return { ...el, subs, lens, total: lens.reduce((a, b) => a + b, 0), start };
  });
}

/** One element at drawing progress p (its subpaths one after another, like a pen), alive with its motion. */
export function RoomElement({ el, p, beat, line, fine, paper = color.paper }: { el: PreparedElement; p: number; beat: number; line: LineStyle; fine: LineStyle; paper?: string }) {
  if (p <= 0) return null;
  const m = el.motion?.(beat) ?? {};
  const s = el.fine ? fine : line;
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
        const solid = el.fill && p >= 1;
        return <path key={i} d={d} fill={solid ? paper : "none"} stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" style={evo ?? undefined} />;
      })}
    </g>
  );
}

/**
 * The elements of a room drawn in a sweep from left to right, many strokes at once (`drawn` 0 → 1), and wiped out
 * the same way (`erased` 0 → 1); `beat` drives the elements' idle motion. Renders `<g>`s for an enclosing SVG in
 * the room box's coordinates.
 */
export function RoomStrokes({
  room,
  drawn,
  erased = 0,
  beat,
  line,
  fine,
  paper,
}: {
  room: PreparedElement[];
  drawn: number;
  erased?: number;
  beat: number;
  line: LineStyle;
  fine: LineStyle;
  /** Fill of the solid elements (the wall's colour). */
  paper?: string;
}) {
  if (drawn <= 0 || erased >= 1) return null;
  return (
    <>
      {room.map((el, i) => {
        const local = (x: number) => Math.max(0, Math.min(1, (x - el.start) / ELEMENT_SPAN));
        const p = pencil(ease.out(local(drawn))) * (1 - ease.in(local(erased)));
        return <RoomElement key={i} el={el} p={p} beat={beat} line={line} fine={fine} paper={paper} />;
      })}
    </>
  );
}
