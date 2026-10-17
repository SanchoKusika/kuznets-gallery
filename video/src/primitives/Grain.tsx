import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Paper grain over the whole frame (brief 5.5): overlay, new pattern every 2 frames, deterministic
 * (feTurbulence seed from the frame). The noise is stretched to full contrast and its strength set
 * so the visible grain is ≈ 3% (an overlay at 3% opacity would round away to nothing in 8 bits);
 * it also dithers gradients against banding.
 */
export function Grain({ strength = 0.32 }: { strength?: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = Math.floor(frame / 2) % 997;
  const id = `grain-${seed}`;
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: strength, pointerEvents: "none" }}>
      <svg width={width} height={height}>
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          {/* Stretch the noise (≈ 0.3…0.7) to 0…1 and make it opaque. */}
          <feComponentTransfer in="g">
            <feFuncR type="linear" slope="2.6" intercept="-0.8" />
            <feFuncG type="linear" slope="2.6" intercept="-0.8" />
            <feFuncB type="linear" slope="2.6" intercept="-0.8" />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
}
