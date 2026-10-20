import { prefersMotion } from "@/features/motion/prefers-motion";
import { bem } from "@/lib/bem";
import { pictureRect } from "@/lib/picture-rect";
import s from "./FlyToOrder.module.scss";

const b = bem(s, "fly-to-order");

/** Size of the copy when it reaches the header button, px. */
const LAND = 28;
/** The copy is at most this big at the start, px. */
const MAX = 320;
const DURATION = 750;

/** The visible header «Заявка» button (the classic or the compact header). */
const target = () => [...document.querySelectorAll<HTMLElement>("[data-order-target]")].find((el) => el.getBoundingClientRect().width > 0);

const visible = (r: DOMRect) => r.bottom > 0 && r.top < innerHeight && r.width > 0;

/**
 * A copy of the artwork flies along an arc into the header «Заявка» button, which bounces when it
 * lands. Starts from the photo, or from `fallback` (the pressed button) when the photo is scrolled
 * away. Resolves on landing: true if it flew, false at once when motion is off or there's no target.
 */
export function flyToOrder(img: HTMLImageElement | null | undefined, fallback: Element): Promise<boolean> {
  const to = target();
  if (!img || !to || !prefersMotion()) return Promise.resolve(false);

  const photo = pictureRect(img);
  const start = visible(photo) ? photo : fallback.getBoundingClientRect();
  const k = Math.min(1, MAX / Math.max(photo.width, photo.height));
  const w = visible(photo) ? photo.width * k : 64;
  const h = visible(photo) ? photo.height * k : 64 * (photo.height / photo.width || 1);
  const x0 = start.left + start.width / 2 - w / 2;
  const y0 = start.top + start.height / 2 - h / 2;
  const end = to.getBoundingClientRect();
  const dx = end.left + end.width / 2 - (x0 + w / 2);
  const dy = end.top + end.height / 2 - (y0 + h / 2);

  // The box moves along x and the picture inside it along y, each with its own easing: an arc.
  const box = document.createElement("div");
  box.className = b();
  box.style.left = `${x0}px`;
  box.style.top = `${y0}px`;
  box.style.width = `${w}px`;
  box.style.height = `${h}px`;
  const copy = document.createElement("img");
  copy.className = b("img");
  copy.src = img.currentSrc || img.src;
  copy.alt = "";
  box.append(copy);
  document.body.append(box);

  const options = { duration: DURATION, fill: "forwards" as const };
  box.animate({ translate: ["0 0", `${dx}px 0`] }, { ...options, easing: "cubic-bezier(.45,0,.85,.5)" });
  const flight = copy.animate(
    [
      { translate: "0 0", scale: "1", borderRadius: "2px" },
      { translate: `0 ${dy}px`, scale: `${LAND / Math.max(w, h)}`, borderRadius: "50%" },
    ],
    { ...options, easing: "cubic-bezier(.2,.65,.35,1)" },
  );

  return flight.finished.then(
    () => {
      box.remove();
      to.animate({ scale: [1, 1.18, 0.94, 1] }, { duration: 420, easing: "ease-out" });
      return true;
    },
    () => {
      box.remove();
      return false;
    },
  );
}
