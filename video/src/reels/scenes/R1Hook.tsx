import { copy } from "../../data/copy";
import { MaskRise } from "../../primitives/MaskRise";
import { display } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { color } from "../../theme/tokens";
import { actTimes } from "./hanging";

/** Two lines of near-equal length, split at an ordinary space (non-breaking ones from typo() hold). */
export function balanceLines(s: string): [string, string] {
  const spaces = [...s.matchAll(/ /g)].map((m) => m.index ?? 0);
  if (!spaces.length) return [s, ""];
  const at = spaces.reduce((best, i) => (Math.abs(i - s.length / 2) < Math.abs(best - s.length / 2) ? i : best));
  return [s.slice(0, at), s.slice(at + 1)];
}

const LINE = display(84, 600, -0.04);
// Room for descenders inside the mask (lh .95 would clip «у»), taken back by the negative margin.
const PAD = 14;
// 105% of the line box, plus the padding, so the line starts fully hidden.
const OFFSET = 105 + (PAD / 84 / 0.95) * 100;

/** The hook as on the styleframe: two centred lines from y 300; `from` / `exit` = rise / leave, act frames. */
export function HookText({ from, exit, top = 300 }: { from?: number; exit?: number; top?: number }) {
  const t = useTiming();
  const T = actTimes(t);
  const lines = balanceLines(copy.reels.hook);
  return (
    <div style={{ position: "absolute", left: 65, right: 65, top, textAlign: "center", color: color.ink }}>
      {lines.map((line, i) => (
        <MaskRise
          key={i}
          from={(from ?? T.hook.from) + i * t.s(0.5)}
          duration={T.hook.duration}
          exit={exit === undefined ? undefined : { from: exit + i * t.s(0.5), duration: T.hook.exitDuration }}
          offset={OFFSET}
          style={{ paddingBottom: PAD, marginBottom: -PAD }}
          innerStyle={LINE}
        >
          {line}
        </MaskRise>
      ))}
    </div>
  );
}

/** R1–R2: the hook rises at R1 +1s and leaves up into its mask at R2 +0. */
export function R1Hook() {
  const T = actTimes(useTiming());
  return <HookText exit={T.hook.exit} />;
}
