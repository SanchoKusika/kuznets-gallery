import type { StyleSpecification } from "maplibre-gl";
import type { Theme } from "@/features/theme/theme";
import { GALLERY_LL } from "./places";

// The prototype's `mapStyle()`: OpenFreeMap vector tiles drawn as tints between the footer
// background and its text colour (`--inverse` / `--inverse-fg` of each theme), accent crosshair.
// WebGL can't read CSS variables, so the values below mirror `styles/_tokens.scss` — keep them in sync.

const INVERSE: Record<Theme, [string, string]> = {
  light: ["#151515", "#f2efe9"],
  dark: ["#0b0b0a", "#efeae2"],
};
const ACCENT = "#e0502e";

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

type FC = GeoJSON.FeatureCollection;
export const EMPTY: FC = { type: "FeatureCollection", features: [] };

const CROSSHAIR: FC = {
  type: "FeatureCollection",
  features: [
    [[GALLERY_LL[0], 41.2], [GALLERY_LL[0], 41.48]],
    [[69.1, GALLERY_LL[1]], [69.55, GALLERY_LL[1]]],
  ].map((coordinates) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } })),
};

/** `highlight` is the gallery's building outline, found after the first render. */
export function mapStyle(theme: Theme, highlight: FC = EMPTY): StyleSpecification {
  const [base, fg] = INVERSE[theme].map(hex);
  const tint = (t: number) => `rgb(${base.map((v, i) => Math.max(0, Math.round(v + (fg[i] - v) * t))).join(",")})`;
  const bg = tint(0.035);

  const cls = ["get", "class"];
  const font = ["Noto Sans Regular"];
  const name = ["coalesce", ["get", "name:ru"], ["get", "name:latin"], ["get", "name"]];
  const roads = ["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service"];
  const big = ["motorway", "trunk", "primary"];
  const width = (z11: number[], z18: number[]) => [
    "interpolate", ["exponential", 1.6], ["zoom"],
    11, ["match", cls, ["motorway", "trunk"], z11[0], "primary", z11[1], ["secondary", "tertiary"], z11[2], z11[3]],
    18, ["match", cls, ["motorway", "trunk"], z18[0], "primary", z18[1], ["secondary", "tertiary"], z18[2], z18[3]],
  ];
  const poi = ["all", ["<=", ["get", "rank"], 30], ["!=", cls, "railway"], ["has", "name"]];
  const halo = (w = 1.2) => ({ "text-halo-color": bg, "text-halo-width": w });
  const omt = (layer: string) => ({ source: "omt", "source-layer": layer });

  const style = {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
      crosshair: { type: "geojson", data: CROSSHAIR },
      highlight: { type: "geojson", data: highlight },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": bg } },
      { id: "green", type: "fill", ...omt("landcover"), filter: ["match", cls, ["grass", "wood", "farmland"], true, false], paint: { "fill-color": tint(0.06) } },
      { id: "park", type: "fill", ...omt("park"), paint: { "fill-color": tint(0.065) } },
      { id: "water", type: "fill", ...omt("water"), paint: { "fill-color": tint(-0.25), "fill-outline-color": tint(0.2) } },
      { id: "waterway-casing", type: "line", ...omt("waterway"), paint: { "line-color": tint(0.2), "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.5, 18, 9] } },
      { id: "waterway", type: "line", ...omt("waterway"), paint: { "line-color": tint(-0.25), "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.6, 18, 7] } },
      { id: "building", type: "fill", ...omt("building"), minzoom: 13, paint: { "fill-color": tint(0.09), "fill-outline-color": tint(0.17) } },
      { id: "highlight", type: "fill", source: "highlight", paint: { "fill-color": ACCENT, "fill-opacity": 0.9 } },
      { id: "path", type: "line", ...omt("transportation"), minzoom: 15, filter: ["match", cls, ["path", "track"], true, false], paint: { "line-color": tint(0.16), "line-width": 1, "line-dasharray": [1, 2] } },
      { id: "rail", type: "line", ...omt("transportation"), filter: ["match", cls, ["rail", "transit"], true, false], paint: { "line-color": tint(0.32), "line-width": 1, "line-dasharray": [4, 3] } },
      {
        id: "road", type: "line", ...omt("transportation"), filter: ["match", cls, roads, true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", cls, ["motorway", "trunk"], tint(0.52), "primary", tint(0.44), ["secondary", "tertiary"], tint(0.34), tint(0.2)],
          "line-width": width([1.6, 1.2, 0.7, 0.3], [22, 18, 13, 7]),
        },
      },
      { id: "crosshair", type: "line", source: "crosshair", paint: { "line-color": ACCENT, "line-width": 1, "line-opacity": 0.55, "line-dasharray": [3, 3] } },
      { id: "poi-dot", type: "circle", ...omt("poi"), minzoom: 15, filter: poi, paint: { "circle-radius": 2.2, "circle-color": tint(0.55) } },
      {
        id: "poi-label", type: "symbol", ...omt("poi"), minzoom: 15, filter: poi,
        layout: { "text-field": name, "text-font": font, "text-size": 10.5, "text-anchor": "left", "text-offset": [0.7, 0], "text-max-width": 9, "text-optional": true },
        paint: { "text-color": tint(0.55), ...halo() },
      },
      {
        id: "waterway-label", type: "symbol", ...omt("waterway"), minzoom: 13,
        layout: { "symbol-placement": "line", "text-field": name, "text-font": font, "text-size": 11, "text-letter-spacing": 0.12 },
        paint: { "text-color": tint(0.6), ...halo() },
      },
      {
        id: "park-label", type: "symbol", ...omt("park"), filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "name"]],
        layout: { "text-field": name, "text-font": font, "text-size": 11, "text-max-width": 8 },
        paint: { "text-color": tint(0.55), ...halo() },
      },
      {
        id: "place-label", type: "symbol", ...omt("place"), filter: ["match", cls, ["suburb", "neighbourhood", "quarter"], true, false],
        layout: { "text-field": name, "text-font": font, "text-size": 11, "text-transform": "uppercase", "text-letter-spacing": 0.3, "text-max-width": 8 },
        paint: { "text-color": tint(0.45), ...halo() },
      },
      {
        id: "road-label", type: "symbol", ...omt("transportation_name"), minzoom: 13, filter: ["match", cls, roads.slice(0, 6), true, false],
        layout: {
          "symbol-placement": "line", "text-field": name, "text-font": font,
          "text-size": ["interpolate", ["linear"], ["zoom"], 14, ["match", cls, big, 11, 9.5], 18, ["match", cls, big, 13.5, 12]],
          "text-transform": "uppercase", "text-letter-spacing": 0.14, "text-max-angle": 30, "symbol-spacing": 320,
        },
        paint: { "text-color": ["match", cls, [...big, "secondary"], tint(0.8), tint(0.6)], ...halo(1.4) },
      },
    ],
  };
  // Expression arrays are typed loosely above; the spec shape is the prototype's, verified in the browser.
  return style as StyleSpecification;
}
