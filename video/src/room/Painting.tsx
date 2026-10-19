import { useCurrentFrame } from "remotion";
import { art } from "../data/art";
import { ArtImage } from "../primitives/ArtImage";
import { ease, progress } from "../theme/easing";
import { fonts } from "../theme/fonts";
import { bold } from "../theme/tokens";
import { FINE, INK, NAIL, PAINT_BOX, PAINT_TOP } from "./layout";

export type Hang = {
  code: string;
  /** Frame it arrives. */
  at: number;
  /** How: dropped onto the nail, flipped over from the last one, or a hard cut (montage). */
  how: "drop" | "flip" | "cut";
  /** Number badge in the corner. */
  n?: number;
};

/** Box of a work on the wall: fits PAINT_BOX, hangs from PAINT_TOP. */
export function paintBox(code: string) {
  const a = art(code);
  const k = Math.min(PAINT_BOX / a.w, PAINT_BOX / a.h);
  const w = Math.round(a.w * k);
  const h = Math.round(a.h * k);
  return { x: NAIL.x - w / 2, y: PAINT_TOP, w, h };
}

const FLIP = 6;

/** The nail, the wire and the current painting (flipping over on its nail at each change). Screen px. */
export function Painting({ hangs, scale = 1 }: { hangs: Hang[]; scale?: number }) {
  const frame = useCurrentFrame();
  let k = -1;
  hangs.forEach((h, i) => {
    if (frame >= h.at - (h.how === "flip" ? FLIP : 0)) k = i;
  });
  const nail = (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <circle cx={NAIL.x} cy={NAIL.y} r={8} fill={INK} />
    </svg>
  );
  if (k < 0) return nail;
  const h = hangs[k];
  // Flip: the old one turns to its edge before `at`, the new one turns in after.
  let rotY = 0;
  let code = h.code;
  if (h.how === "flip") {
    if (frame < h.at) {
      rotY = 90 * progress(frame, h.at - FLIP, FLIP, ease.in);
      code = hangs[k - 1]?.code ?? h.code;
    } else rotY = -90 * (1 - progress(frame, h.at, FLIP + 2, ease.out));
  }
  const box = paintBox(code);
  // Drop: falls onto the nail and bounces.
  const drop = h.how === "drop" ? progress(frame, h.at, 10, ease.in) : 1;
  const dropY = h.how === "drop" ? (1 - drop) * -900 + (frame >= h.at + 10 ? -18 * Math.exp(-(frame - h.at - 10) / 5) * Math.sin((frame - h.at - 10) * 0.9) : 0) : 0;
  // A small swing after every change.
  const since = frame - h.at;
  const swing = since > 0 ? 3.5 * Math.exp(-since / 14) * Math.sin(since * 0.32) : 0;
  const cut = h.how === "cut" ? 1 + 0.04 * (1 - progress(frame, h.at, 5, ease.out)) : 1;
  const badge = h.n ? progress(frame, h.at + 3, 8, ease.out) : 0;

  return (
    <>
      {/* The wire only once the painting hangs (a falling one has nothing to hang by yet). */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: h.how === "drop" && frame < h.at + 10 ? 0 : 1 }}>
        <path
          d={`M${box.x + box.w * 0.18} ${box.y + 14 + dropY}L${NAIL.x} ${NAIL.y}L${box.x + box.w * 0.82} ${box.y + 14 + dropY}`}
          fill="none"
          stroke={INK}
          strokeWidth={FINE}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y + dropY,
          transformOrigin: `${NAIL.x - box.x}px ${NAIL.y - box.y}px`,
          transform: `perspective(1600px) rotateZ(${swing}deg) rotateY(${rotY}deg) scale(${cut})`,
        }}
      >
        <ArtImage code={code} width={box.w} height={box.h} shadow parentScale={scale * cut} />
        {badge > 0 && h.n ? (
          <div
            style={{
              position: "absolute",
              right: -26,
              top: -26,
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: bold.accent,
              color: "#FFFFFF",
              border: `4px solid ${INK}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 34,
              scale: String(badge + 0.25 * Math.sin(Math.PI * badge)),
            }}
          >
            {h.n}
          </div>
        ) : null}
      </div>
      {nail}
    </>
  );
}
