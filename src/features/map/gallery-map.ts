import type { LngLat as YLngLat, LngLatBounds, YMap, YMapDefaultSchemeLayer } from "@yandex/ymaps3-types";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { getLenis } from "@/features/scroll/smooth-scroll";
import type { Theme } from "@/features/theme/theme";
import { bem } from "@/lib/bem";
import { GALLERY_BUILDING, GALLERY_LL, GALLERY_ZOOM, METRO, type Station } from "./places";
import { ACCENT, mapCustomization } from "./style";
import s from "./GalleryMap.module.scss";

const b = bem(s, "map");

// Yandex zoom is one step above MapLibre's for the same scale (256 px tiles against 512).
const ZOOM = GALLERY_ZOOM + 1;
const ZOOM_RANGE = { min: 12, max: 19.5 };

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

let loading: Promise<typeof ymaps3> | null = null;

/** Loads the JS API 3.0 script once; a failed load can be retried on the next mount. */
function loadYmaps(apiKey: string) {
  // Already on the page (e.g. this module was hot-reloaded): don't add a second script.
  if (!loading && typeof ymaps3 !== "undefined") loading = ymaps3.ready.then(() => ymaps3);
  loading ??= new Promise<typeof ymaps3>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => ymaps3.ready.then(() => resolve(ymaps3), reject);
    script.onerror = reject;
    document.head.append(script);
  }).catch((e) => {
    loading = null;
    throw e;
  });
  return loading;
}

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const isTouch = () => matchMedia("(hover: none), (pointer: coarse)").matches;

/**
 * The footer map: Yandex JS API 3.0 recoloured in the footer palette, with the gallery pin and
 * building and the metro pills. A plain wheel scrolls the page (Ctrl / ⌘ + wheel zooms) and one
 * finger scrolls on touch screens, with a hint over the map.
 */
export async function createGalleryMap(container: HTMLElement, theme: Theme, apiKey: string): Promise<GalleryMap> {
  const y = await loadYmaps(apiKey);

  container.classList.add(s.map);
  let currentTheme = theme;

  const scheme: YMapDefaultSchemeLayer = new y.YMapDefaultSchemeLayer({ customization: mapCustomization(theme) });
  const map: YMap = new y.YMap(
    container,
    {
      location: { center: GALLERY_LL, zoom: ZOOM },
      zoomRange: ZOOM_RANGE,
      behaviors: ["drag", "pinchZoom", "scrollZoom", "dblClick"],
      theme: "dark",
      mode: "vector",
      // Bottom left holds the coordinates pill.
      distributionPosition: "top left",
    },
    [scheme, new y.YMapDefaultFeaturesLayer({})],
  );

  // A half-built map must not stay under the fallback text.
  try {
    const duration = (ms: number) => (prefersMotion() ? ms : 0);

    // Dashed accent crosshair through the gallery and its building in accent.
    const dash = { color: ACCENT, width: 1, opacity: 0.55, dash: [3, 3] };
    const line = (coordinates: YLngLat[]) =>
      new y.YMapFeature({ geometry: { type: "LineString", coordinates }, style: { stroke: [dash], interactive: false } });
    map.addChild(line([[GALLERY_LL[0], 41.2], [GALLERY_LL[0], 41.48]]));
    map.addChild(line([[69.1, GALLERY_LL[1]], [69.55, GALLERY_LL[1]]]));
    map.addChild(
      new y.YMapFeature({
        geometry: { type: "Polygon", coordinates: [GALLERY_BUILDING] },
        style: { fill: ACCENT, fillOpacity: 0.9, stroke: [{ width: 0 }], interactive: false },
      }),
    );

    const marker = (ll: YLngLat, element: HTMLElement, zIndex = 0) =>
      map.addChild(new y.YMapMarker({ coordinates: ll, zIndex }, element));

    const show = (st: Station) => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      const p = Math.min(56, H * 0.14, W * 0.1);
      const mirror: YLngLat = [2 * GALLERY_LL[0] - st.ll[0], 2 * GALLERY_LL[1] - st.ll[1]];
      const bounds: LngLatBounds = [
        [Math.min(mirror[0], st.ll[0]), Math.max(mirror[1], st.ll[1])],
        [Math.max(mirror[0], st.ll[0]), Math.min(mirror[1], st.ll[1])],
      ];
      map.update({ margin: [p, p, p, p] });
      map.update({ location: { bounds, duration: duration(1100) } });
    };

    const metroEls = METRO.map((st) => {
      const pill = el(b("metro"), `<span class="${b("metro-badge")}">М</span>${st.n}`);
      pill.onclick = (ev) => {
        ev.stopPropagation();
        show(st);
      };
      pill.onmouseenter = () => pill.classList.add(s["map__metro--on"]);
      pill.onmouseleave = () => pill.classList.remove(s["map__metro--on"]);
      marker(st.ll, pill, 2);
      return pill;
    });

    marker(
      GALLERY_LL,
      el(
        b("pin"),
        `<div class="${b("pin-pulse")}"></div><div class="${b("pin-dot")}"></div><div class="${b("pin-label")}">Kuznetsovs Gallery</div>`,
      ),
      3,
    );

    // Hint over the map for a plain wheel / one-finger drag.
    const hint = el(b("hint"));
    container.append(hint);
    let hintTimer = 0;
    const showHint = (text: string, ms: number) => {
      hint.textContent = text;
      hint.classList.add(s["map__hint--on"]);
      clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => hint.classList.remove(s["map__hint--on"]), ms);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return hint.classList.remove(s["map__hint--on"]);
      // Keeps the wheel away from the map (and from Lenis on window), so the page scroll is
      // handed to Lenis here; without it (reduced motion) the browser scrolls natively.
      e.stopPropagation();
      const lenis = getLenis();
      if (lenis && !lenis.isStopped) {
        e.preventDefault();
        const line = e.deltaMode === 1 ? 100 / 6 : e.deltaMode === 2 ? innerHeight : 1;
        lenis.scrollTo(lenis.targetScroll + e.deltaY * line);
      }
      showHint(isMac() ? "⌘ + колесо — масштаб карты" : "Ctrl + колесо — масштаб карты", 1000);
    };
    container.addEventListener("wheel", onWheel, { capture: true, passive: false });
    // `touch-action: pan-x pan-y` lets one finger scroll the page; with two fingers the browser
    // must not pan it too, or it cancels the map's drag.
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    container.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });

    map.addChild(
      new y.YMapListener({
        onActionStart: (e) => {
          if (e.type !== "drag" || !isTouch() || e.points.length > 1) return;
          showHint("Двигайте карту двумя пальцами", 1000);
          e.preventDefault();
        },
      }),
    );

    let removed = false;
    const live =
      <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        if (!removed) fn(...args);
      };
    const zoomBy = (d: number) => {
      const zoom = Math.min(ZOOM_RANGE.max, Math.max(ZOOM_RANGE.min, map.zoom + d));
      map.update({ location: { center: map.center as YLngLat, zoom, duration: duration(300) } });
    };

    return {
      zoomIn: live(() => zoomBy(1)),
      zoomOut: live(() => zoomBy(-1)),
      recenter: live(() => map.update({ location: { center: GALLERY_LL, zoom: ZOOM, duration: duration(900) } })),
      show: live(show),
      highlight: (i, on) => metroEls[i]?.classList.toggle(s["map__metro--on"], on),
      setTheme: live((next: Theme) => {
        if (next === currentTheme) return;
        currentTheme = next;
        scheme.update({ customization: mapCustomization(next) });
      }),
      destroy() {
        if (removed) return;
        removed = true;
        clearTimeout(hintTimer);
        container.removeEventListener("wheel", onWheel, { capture: true });
        container.removeEventListener("touchmove", onTouchMove, { capture: true });
        hint.remove();
        map.destroy();
      },
    };
  } catch (e) {
    map.destroy();
    throw e;
  }
}
