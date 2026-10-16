import type { GeoJSONSource, Map as MlMap } from "maplibre-gl";
import { prefersMotion } from "@/features/motion/prefers-motion";
import type { Theme } from "@/features/theme/theme";
import { bem } from "@/lib/bem";
import { CANAL, GALLERY_LL, GALLERY_ZOOM, METRO, NEAR, type LngLat, type Station } from "./places";
import { EMPTY, mapStyle } from "./style";
import s from "./GalleryMap.module.scss";

const b = bem(s, "map");

/** Neighbour labels and the canal show from this zoom on. */
const NEAR_ZOOM = 15.5;

export type GalleryMap = {
  zoomIn(): void;
  zoomOut(): void;
  recenter(): void;
  show(station: Station): void;
  highlight(i: number, on: boolean): void;
  setTheme(theme: Theme): void;
  destroy(): void;
};

function el(className: string, html = "") {
  const e = document.createElement("div");
  e.className = className;
  e.innerHTML = html;
  return e;
}

/** Ray casting over the outer ring of a polygon. */
function inRing(pt: LngLat, ring: GeoJSON.Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function centroid(poly: GeoJSON.Position[][]): LngLat {
  const ring = poly[0] ?? [];
  if (!ring.length) return [1e9, 1e9];
  const sum = ring.reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}

const dist2 = (c: LngLat) => (c[0] - GALLERY_LL[0]) ** 2 + (c[1] - GALLERY_LL[1]) ** 2;

/**
 * The footer map from the prototype (`initMap`): MapLibre on OpenFreeMap tiles, styled in the
 * footer palette, with the gallery pin, metro and neighbour labels. MapLibre is loaded on demand.
 */
export async function createGalleryMap(container: HTMLElement, theme: Theme, onFail: () => void): Promise<GalleryMap> {
  const ml = await import("maplibre-gl");
  container.classList.add(s.map);
  let currentTheme = theme;
  let highlight = EMPTY;

  const map: MlMap = new ml.Map({
    container,
    style: mapStyle(theme),
    center: GALLERY_LL,
    zoom: GALLERY_ZOOM,
    minZoom: 11,
    maxZoom: 18.5,
    attributionControl: false,
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
    locale: {
      "CooperativeGesturesHandler.WindowsHelpText": "Ctrl + колесо — масштаб карты",
      "CooperativeGesturesHandler.MacHelpText": "⌘ + колесо — масштаб карты",
      "CooperativeGesturesHandler.MobileHelpText": "Двигайте карту двумя пальцами",
    },
  });
  map.touchZoomRotate.disableRotation();

  // Tile server unreachable: the source fails before the first render (tile errors later are
  // left to MapLibre). The frame then shows the fallback text instead of an empty map.
  let loaded = false;
  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    map.remove();
  };
  map.once("load", () => (loaded = true));
  map.on("error", (e) => {
    if (loaded || "tile" in e) return;
    remove();
    onFail();
  });

  const duration = (ms: number) => (prefersMotion() ? ms : 0);

  const show = (st: Station) => {
    const mirror: LngLat = [2 * GALLERY_LL[0] - st.ll[0], 2 * GALLERY_LL[1] - st.ll[1]];
    const W = container.clientWidth;
    const H = container.clientHeight;
    const p = Math.min(56, H * 0.14, W * 0.1);
    map.fitBounds(
      [
        [Math.min(mirror[0], st.ll[0]), Math.min(mirror[1], st.ll[1])],
        [Math.max(mirror[0], st.ll[0]), Math.max(mirror[1], st.ll[1])],
      ],
      { padding: p, maxZoom: 16.5, duration: duration(1100) },
    );
  };

  const metroEls = METRO.map((st) => {
    const e = el(b("metro"), `<span class="${b("metro-badge")}">М</span>${st.n}`);
    e.onclick = (ev) => {
      ev.stopPropagation();
      show(st);
    };
    e.onmouseenter = () => e.classList.add(s["map__metro--on"]);
    e.onmouseleave = () => e.classList.remove(s["map__metro--on"]);
    new ml.Marker({ element: e, anchor: "left", offset: [-13, 0] }).setLngLat(st.ll).addTo(map);
    return e;
  });

  // Labels sit inside the marker element: MapLibre writes its own inline opacity on markers.
  for (const p of NEAR) {
    const dot = `<span class="${b("near-dot")}"></span>`;
    const text = `<span>${p.n}</span>`;
    const e = el("", `<div class="${b("near")}">${p.side === "left" ? dot + text : text + dot}</div>`);
    new ml.Marker({ element: e, anchor: p.side, offset: [p.side === "left" ? -2.5 : 2.5, 0] }).setLngLat(p.ll).addTo(map);
  }
  const canal = el("", `<div class="${b("near", { canal: true })}"><div class="${b("canal-text")}">${CANAL.n}</div></div>`);
  new ml.Marker({ element: canal, anchor: "center" }).setLngLat(CANAL.ll).addTo(map);

  const nearOn = s["map--near"];
  const updateNear = () => container.classList.toggle(nearOn, map.getZoom() >= NEAR_ZOOM);
  map.on("zoom", updateNear);
  updateNear();

  const pin = el(
    b("pin"),
    `<div class="${b("pin-pulse")}"></div><div class="${b("pin-dot")}"></div><div class="${b("pin-label")}">Kuznetsovs Gallery</div>`,
  );
  new ml.Marker({ element: pin, anchor: "center" }).setLngLat(GALLERY_LL).addTo(map);

  // Fill the gallery's building in accent: the rendered footprint under the pin (or the nearest one).
  map.once("idle", () => {
    const p = map.project(GALLERY_LL);
    const features = map.queryRenderedFeatures(
      [
        [p.x - 12, p.y - 12],
        [p.x + 12, p.y + 12],
      ],
      { layers: ["building"] },
    );
    const parts: GeoJSON.Position[][][] = [];
    for (const f of features) {
      const g = f.geometry;
      if (g.type === "Polygon") parts.push(g.coordinates);
      else if (g.type === "MultiPolygon") parts.push(...g.coordinates);
    }
    if (!parts.length) return;
    const part =
      parts.find((poly) => poly[0] && inRing(GALLERY_LL, poly[0])) ??
      parts.reduce((a, c) => (dist2(centroid(a)) <= dist2(centroid(c)) ? a : c));
    if (dist2(centroid(part)) > 1e-6) return;
    highlight = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: part } }] };
    map.getSource<GeoJSONSource>("highlight")?.setData(highlight);
  });

  // After a failed start the map is gone; the controls stay on screen, so they become no-ops.
  const live =
    <A extends unknown[]>(fn: (...args: A) => void) =>
    (...args: A) => {
      if (!removed) fn(...args);
    };
  const still = prefersMotion() ? undefined : { duration: 0 };

  return {
    zoomIn: live(() => map.zoomIn(still)),
    zoomOut: live(() => map.zoomOut(still)),
    recenter: live(() => map.easeTo({ center: GALLERY_LL, zoom: GALLERY_ZOOM, duration: duration(900) })),
    show: live(show),
    highlight: (i, on) => metroEls[i]?.classList.toggle(s["map__metro--on"], on),
    setTheme: live((next: Theme) => {
      if (next === currentTheme) return;
      currentTheme = next;
      map.setStyle(mapStyle(next, highlight));
    }),
    destroy: remove,
  };
}
