import type { CustomizationConfig } from "@yandex/ymaps3-types";
import type { Theme } from "@/features/theme/theme";

// The prototype's map palette on the Yandex scheme: everything is a tint between the footer
// background and its text colour (`--inverse` / `--inverse-fg` of each theme), plus accent.
// The map can't read CSS variables, so the values below mirror `styles/_tokens.scss` — keep them in sync.

const INVERSE: Record<Theme, [string, string]> = {
  light: ["#151515", "#f2efe9"],
  dark: ["#0b0b0a", "#efeae2"],
};
export const ACCENT = "#e0502e";

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

/** `t` = 0 is the footer background, 1 its text colour; below 0 is darker than the background. */
function tints(theme: Theme) {
  const [base, fg] = INVERSE[theme].map(hex);
  return (t: number) => toHex(base.map((v, i) => Math.min(255, Math.max(0, Math.round(v + (fg[i] - v) * t)))));
}

export function mapCustomization(theme: Theme): CustomizationConfig {
  const tint = tints(theme);
  const bg = tint(0.035);

  return [
    { elements: "geometry", stylers: { color: bg } },
    { tags: { any: ["vegetation", "park", "national_park", "cemetery", "sports_ground", "beach"] }, elements: "geometry", stylers: { color: tint(0.065) } },
    { tags: { any: ["water"] }, elements: "geometry", stylers: { color: tint(-0.25) } },
    { tags: { any: ["building", "structure"] }, elements: "geometry.fill", stylers: { color: tint(0.09) } },
    { tags: { any: ["building", "structure"] }, elements: "geometry.outline", stylers: { color: tint(0.17) } },
    { tags: { any: ["path", "crosswalk", "road_minor", "road_unclassified", "road_limited"] }, elements: "geometry", stylers: { color: tint(0.16) } },
    { tags: { any: ["road_6", "road_7"] }, elements: "geometry", stylers: { color: tint(0.2) } },
    { tags: { any: ["road_4", "road_5"] }, elements: "geometry", stylers: { color: tint(0.34) } },
    { tags: { any: ["road_3"] }, elements: "geometry", stylers: { color: tint(0.44) } },
    { tags: { any: ["road_1", "road_2"] }, elements: "geometry", stylers: { color: tint(0.52) } },
    { tags: { any: ["transit_line"] }, elements: "geometry", stylers: { color: tint(0.32) } },
    { tags: { any: ["admin"] }, types: "polyline", elements: "geometry", stylers: { color: tint(0.2) } },

    { elements: "label.text.fill", stylers: { color: tint(0.55) } },
    { elements: "label.text.outline", stylers: { color: bg } },
    { tags: { any: ["road"] }, elements: "label.text.fill", stylers: { color: tint(0.65) } },
    { tags: { any: ["road_1", "road_2", "road_3", "road_4"] }, elements: "label.text.fill", stylers: { color: tint(0.8) } },
    { tags: { any: ["district", "locality", "admin"] }, elements: "label.text.fill", stylers: { color: tint(0.45) } },
    { tags: { any: ["water"] }, elements: "label.text.fill", stylers: { color: tint(0.6) } },
    { elements: "label.icon", stylers: { saturation: -1, lightness: -0.45 } },
  ];
}
