import { useTiming, type Timing } from "../../theme/timing";
import { R6Custom } from "./R6Custom";

/** R6 runs ½b into R8: its texts leave into their masks around the cut to the 3D canvas. */
export const ACT_CUSTOM_LENGTH = (t: Timing) => t.bar(1) + t.e(1);

/**
 * R6 (bar 7): the custom work is sketched and filled. The flat picture is shown until the bar's end, where R8's 3D
 * canvas takes over at the same place (CANVAS_HANDOFF).
 */
export function ActCustom() {
  const t = useTiming();
  return <R6Custom cut={t.bar(1)} />;
}
