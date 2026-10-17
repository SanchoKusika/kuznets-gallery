import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ARCH,
  HALL,
  hallLabel,
  hallWorkRect,
  LIGHT_FRAMES_LAYOUT,
  lightFrames,
  MOON_STARS_AT,
  moonStars,
  p5Arch,
  p5Circle,
  plantA,
  plantB,
  PROMO_INTERIORS,
  SHOWROOM_GRID,
  SHOWROOM_PHOTOS,
  showroom,
} from "../lines/promo";
import { LineDrawing, MorphLines, pencil } from "../primitives/LinePath";
import { ease, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";
import { color, dark, stroke } from "../theme/tokens";

const ink = { color: color.ink, width: stroke.promo };
const ghost = { fill: "none", stroke: color.ink4, strokeWidth: 1.5, strokeDasharray: "6 6" } as const;

type R = { x: number; y: number; w: number; h: number };
const Ghosts = ({ rects }: { rects: R[] }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {rects.map((r, i) => (
      <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} {...ghost} />
    ))}
  </svg>
);

/**
 * Dev sheet for the Promo drawings: eight segments of ½ bar, each drawn on in 1⅓ beats then held —
 * four halls (works and labels as dashed placeholders), plants, P1 frames and moon (dark),
 * showroom (grid wall dashed), circle → arch morph.
 */
export const LinesPromoPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, bar } = useTiming();
  const seg = bar(0.5);
  const i = Math.min(7, Math.floor(frame / seg));
  const f = frame - i * seg;
  const draw = pencil(progress(f, 0, b(1.33), ease.out));

  if (i < 4) {
    const works = HALL.slots.map((_, k) => hallWorkRect(k));
    const labels = HALL.slots.map((_, k) => ({ ...hallLabel(k), h: 150 }));
    return (
      <AbsoluteFill style={{ backgroundColor: color.paper }}>
        <Ghosts rects={[...works, ...labels]} />
        <LineDrawing
          art={PROMO_INTERIORS[i]}
          progress={draw}
          x={HALL.interior.x}
          y={HALL.interior.y}
          thread={{ from: "left", frameWidth: 1920 }}
          {...ink}
        />
      </AbsoluteFill>
    );
  }
  if (i === 4) {
    return (
      <AbsoluteFill style={{ backgroundColor: color.paper }}>
        <Ghosts rects={HALL.slots.map((_, k) => hallWorkRect(k))} />
        <LineDrawing art={plantA} progress={draw} x={180} y={1080 - plantA.h} {...ink} />
        <LineDrawing art={plantB} progress={draw} x={1400} y={1080 - plantB.h} {...ink} />
      </AbsoluteFill>
    );
  }
  if (i === 5) {
    const line = { color: dark.line, width: stroke.promo, opacity: 0.35 };
    // Second half: show the pictures' rects lit, to check the frames' proportions.
    const lit = f > seg / 2;
    return (
      <AbsoluteFill style={{ backgroundColor: lit ? color.paper : dark.paper }}>
        <LineDrawing art={lightFrames} progress={draw} x={0} y={0} {...(lit ? ink : line)} />
        <LineDrawing art={moonStars} progress={draw} x={MOON_STARS_AT.x} y={MOON_STARS_AT.y} {...(lit ? ink : line)} />
        {lit && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {LIGHT_FRAMES_LAYOUT.map((r) => (
              <rect key={r.code} x={r.x} y={r.y} width={r.w} height={r.h} fill={color.paper3} />
            ))}
          </svg>
        )}
      </AbsoluteFill>
    );
  }
  if (i === 6) {
    return (
      <AbsoluteFill style={{ backgroundColor: color.paper }}>
        <Ghosts rects={[SHOWROOM_GRID]} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {SHOWROOM_PHOTOS.map((r) => (
            <rect key={r.code} x={r.x} y={r.y} width={r.w} height={r.h} fill={color.paper3} />
          ))}
        </svg>
        <LineDrawing art={showroom} progress={draw} x={0} y={0} thread={{ from: "left", frameWidth: 1920 }} {...ink} />
      </AbsoluteFill>
    );
  }
  const drawCircle = pencil(progress(f, 0, b(0.75), ease.out));
  const t = progress(f, b(0.75), b(0.5), ease.inOut);
  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      {t >= 1 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <path d={p5Arch.parts[0]} fill={color.paper3} />
        </svg>
      )}
      {t <= 0 ? (
        <LineDrawing art={p5Circle} progress={drawCircle} x={0} y={0} {...ink} />
      ) : (
        <MorphLines from={p5Circle} to={p5Arch} t={t} x={0} y={0} {...ink} />
      )}
      <div style={{ position: "absolute", left: ARCH.cx - 4, top: ARCH.cy + ARCH.h / 2 - 4, width: 8, height: 8, background: color.accent }} />
    </AbsoluteFill>
  );
};
