import { useMemo } from "react";
import { fonts } from "../theme/fonts";
import { color } from "../theme/tokens";

// The site's wave ribbon (src/components/home/WaveRibbon, brief 6.3) for a frame `width` wide: a sine 2.6 periods
// long reaching 22% past both edges, an accent band, titles in on-accent Onest 700 caps running along it. The site
// is drawn for a 1440 viewBox; sizes scale with the width.

const SITE = { amplitude: 44, band: 60, fontSize: 34, tracking: 2 } as const;
const SEPARATOR = " ✦ ";

/** Site speed in px per 60 Hz frame for a ribbon this wide (60/55 viewBox units at 1440). */
export const ribbonSpeed = (width: number) => (60 / 55) * (width / 1440);

function wavePath(width: number, cy: number, amplitude: number) {
  const x0 = -Math.round(width * 0.22);
  const x1 = Math.round(width * 1.22);
  const period = (x1 - x0) / 2.6;
  let d = "";
  for (let x = x0; x <= x1; x += 8) d += `${x === x0 ? "M" : "L"}${x},${(cy + Math.sin(((x - x0) / period) * Math.PI * 2) * amplitude).toFixed(1)}`;
  return d;
}

/** The ribbon at a text offset (px along the wave, negative = run left). Place it with its own transform. */
export function WaveRibbon({ titles, width, cy, offset, id = "ribbon" }: { titles: readonly string[]; width: number; cy: number; offset: number; id?: string }) {
  const k = width / 1440;
  const d = useMemo(() => wavePath(width, cy, SITE.amplitude * k), [width, cy, k]);
  const line = titles.map((t) => t.toUpperCase()).join(SEPARATOR) + SEPARATOR;
  return (
    <svg width={width} height={cy * 2} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path id={id} d={d} fill="none" stroke={color.accent} strokeWidth={SITE.band * k} strokeLinejoin="round" />
      <text dominantBaseline="central" style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: SITE.fontSize * k, letterSpacing: SITE.tracking * k, fill: color.onAccent }}>
        <textPath href={`#${id}`} startOffset={offset}>
          {line.repeat(3)}
        </textPath>
      </text>
    </svg>
  );
}
