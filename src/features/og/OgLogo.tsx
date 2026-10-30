import { LOGO_PATHS } from "@/components/ui/Logo/logo-paths";

// The logo for next/og cards: the vector parts of components/ui/Logo flat in one SVG (no animation, no theme
// tokens). `light` — for a dark card: letters and beads in paper.

const INK = { dark: { ink: "#231F27", ink2: "#343638" }, light: { ink: "#F2EFE9", ink2: "rgba(242,239,233,.72)" } };

export function OgLogo({ width, light = false }: { width: number; light?: boolean }) {
  const { ink, ink2 } = INK[light ? "light" : "dark"];
  const paths: [d: string, fill: string][] = [
    [LOGO_PATHS.wave, "#FBF172"],
    ...LOGO_PATHS.beads.map((d): [string, string] => [d, ink]),
    ...LOGO_PATHS.letters.map((d): [string, string] => [d, ink]),
    [LOGO_PATHS.dot, "#F48157"],
    ...LOGO_PATHS.gallery.map((d): [string, string] => [d, ink2]),
  ];
  return (
    <svg width={width} height={(width * 192) / 499} viewBox="0 0 499 192">
      {paths.map(([d, fill], i) => (
        <path key={i} d={d} fill={fill} fillRule="evenodd" />
      ))}
    </svg>
  );
}
