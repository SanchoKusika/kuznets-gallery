import { bem } from "@/lib/bem";
import s from "./GalleryMap.module.scss";

const b = bem(s, "map");

/** Taps on the gallery pin that pour the tea, and the time they must all fall in, ms. */
const TAPS = 3;
const WITHIN_MS = 1500;
/** How long the bowl stays (the keyframes in GalleryMap.module.scss run as long), ms. */
const STAY_MS = 5600;

// A piyola with green tea and three wisps of steam; the note under it is the easter egg's text.
const TEA_HTML = `<svg class="${b("tea-bowl")}" viewBox="0 0 64 56" width="64" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path class="${b("tea-steam")}" d="M23 21c-4-4 4-7 0-12"/><path class="${b("tea-steam", { n: 2 })}" d="M32 22c-4-5 4-8 0-15"/><path class="${b("tea-steam", { n: 3 })}" d="M41 21c-4-4 4-7 0-12"/>
<path d="M10 28h44c0 12-9 20-22 20S10 40 10 28z"/><ellipse class="${b("tea-surface")}" cx="32" cy="28" rx="22" ry="3" stroke="none"/><path d="M24 52h16"/>
</svg>
<div class="${b("tea-note")}" role="status">Чайник уже на плите. Приезжайте в Сайрам — потрогаете холсты вживую</div>`;

/**
 * Easter egg: three quick taps on the gallery pin pour a bowl of green tea beside it, with an
 * invitation. Returns the cleanup. Clicks stop here, so the map's double-click zoom doesn't fire.
 */
export function pourTeaOnTaps(pin: HTMLElement) {
  let taps = 0;
  let reset = 0;
  let leave = 0;
  let tea: HTMLElement | null = null;

  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (tea) return;
    clearTimeout(reset);
    if (++taps < TAPS) {
      reset = window.setTimeout(() => (taps = 0), WITHIN_MS);
      return;
    }
    taps = 0;
    tea = document.createElement("div");
    tea.className = b("tea");
    tea.innerHTML = TEA_HTML;
    pin.append(tea);
    leave = window.setTimeout(() => {
      tea?.remove();
      tea = null;
    }, STAY_MS);
  };
  const stop = (e: Event) => e.stopPropagation();

  pin.addEventListener("click", onClick);
  pin.addEventListener("dblclick", stop);
  return () => {
    pin.removeEventListener("click", onClick);
    pin.removeEventListener("dblclick", stop);
    clearTimeout(reset);
    clearTimeout(leave);
    tea?.remove();
  };
}
