import { CameraMotionBlur } from "@remotion/motion-blur";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { archOutline, ARCH, circleOutline } from "../lines/promo";
import { ArtImage } from "../primitives/ArtImage";
import { shapeMorph } from "../primitives/LinePath";
import { ease, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";
import { color, stroke } from "../theme/tokens";

type Props = {
  /** Works in the window: the first is there as the circle starts to morph, each next rises from the bottom. */
  works: readonly { code: string; at: number }[];
  /** Circle → arch (frames relative to the Sequence). */
  morph: { from: number; duration: number };
  /** A new work's rise. */
  rise: number;
  /** The outline grows and flies past the camera; the picture fades out without scaling. */
  fly: { from: number; duration: number };
};

/** Box the works are drawn in: wide as the circle, tall as the arch, centred on the window. */
const BOX = { w: 2 * ARCH.circleR, h: ARCH.h };

/**
 * "Change by form" in an arch (brief 6.3 ArchWindow, P5): a vector outline centred on the frame morphs from the
 * circle of the montage into a Central-Asian pointed arch; the works change inside it by rising from the mask; at the
 * end the outline grows past the camera (with motion blur) while the picture fades where it is.
 */
export function ArchWindow({ works, morph, rise, fly }: Props) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const shape = useMemo(
    () => shapeMorph(circleOutline(ARCH.circleR, ARCH.cx - ARCH.circleR, ARCH.cy - ARCH.circleR), archOutline(ARCH.w, ARCH.h, ARCH.cx - ARCH.w / 2, ARCH.cy - ARCH.h / 2)),
    [],
  );
  const d = shape(progress(frame, morph.from, morph.duration, ease.inOut));
  const grow = progress(frame, fly.from, fly.duration, ease.in);
  const scale = 1 + 9 * grow;
  const fade = 1 - progress(frame, fly.from, fly.duration * 0.45, ease.out);
  // The outline comes in with the morph (the circle of the montage had none).
  const outline = progress(frame, morph.from, t.s(1), ease.linear) * (1 - progress(frame, fly.from + fly.duration * 0.7, fly.duration * 0.3, ease.linear));

  let i = 0;
  while (i + 1 < works.length && frame >= works[i + 1].at) i++;
  const p = progress(frame, works[i].at, rise, ease.rise);
  const layers = i > 0 && p < 1 ? [i - 1, i] : [i];

  const transform = `translate(${ARCH.cx} ${ARCH.cy}) scale(${scale}) translate(${-ARCH.cx} ${-ARCH.cy})`;
  const frameStyle = { position: "absolute", left: ARCH.cx - BOX.w / 2, top: ARCH.cy - BOX.h / 2, width: BOX.w, height: BOX.h } as const;

  const content = (
    <AbsoluteFill>
      {fade > 0 ? (
        <AbsoluteFill style={{ clipPath: `path("${d}")`, opacity: fade }}>
          <div style={{ ...frameStyle, overflow: "hidden" }}>
            {layers.map((k) => (
              <div key={k} style={{ position: "absolute", inset: 0, translate: k === i && i > 0 ? `0 ${(1 - p) * 100}%` : undefined }}>
                <ArtImage code={works[k].code} width={BOX.w} height={BOX.h} />
              </div>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      {outline > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: outline }}>
          <path d={d} transform={transform} fill="none" stroke={color.ink} strokeWidth={stroke.promo} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
  return grow > 0 && grow < 1 ? (
    <CameraMotionBlur shutterAngle={180} samples={8}>
      {content}
    </CameraMotionBlur>
  ) : (
    content
  );
}
