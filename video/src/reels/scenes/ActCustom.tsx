import { Sequence } from "remotion";
import { useTiming } from "../../theme/timing";
import { R6Custom } from "./R6Custom";
import { R7Reviews } from "./R7Reviews";

/**
 * R6–R7 (bars 7–9): the custom work is sketched and filled (R6), then turns in 3D under two reviews (R7).
 * The flat picture of R6 cuts to the 3D canvas of R7 on R7's first frame; R6's texts leave into their masks
 * around that cut, so R6's Sequence runs half a beat into R7.
 */
export function ActCustom() {
  const t = useTiming();
  const cut = t.bar(1);
  return (
    <>
      <Sequence name="R7 холст и отзывы" from={cut} durationInFrames={t.bar(2)} premountFor={t.b(1)}>
        <R7Reviews />
      </Sequence>
      <Sequence name="R6 на заказ" durationInFrames={cut + t.e(2)}>
        <R6Custom cut={cut} />
      </Sequence>
    </>
  );
}
