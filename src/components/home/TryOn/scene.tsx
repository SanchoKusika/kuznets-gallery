// Furniture and a person for «Примерьте размер», drawn in centimetres: 1 viewBox unit = 1 cm,
// so each SVG is sized on the wall by its real width and height.

import type { ReactNode } from "react";
import { bem } from "@/lib/bem";
import s from "./TryOn.module.scss";

const b = bem(s, "try-on");
const light = b("furniture-light");
const dark = b("furniture-dark");

export type FurnitureKey = "sofa" | "chest" | "bed";

export const FURNITURE: Record<FurnitureKey, { name: string; w: number; h: number; art: ReactNode }> = {
  sofa: {
    name: "Диван",
    w: 210,
    h: 84,
    art: (
      <>
        <rect className={dark} x="10" y="0" width="190" height="52" rx="9" />
        <rect className={light} x="0" y="26" width="28" height="50" rx="9" />
        <rect className={light} x="182" y="26" width="28" height="50" rx="9" />
        <rect className={light} x="22" y="44" width="83" height="30" rx="6" />
        <rect className={light} x="105" y="44" width="83" height="30" rx="6" />
        <rect className={dark} x="16" y="76" width="6" height="8" />
        <rect className={dark} x="188" y="76" width="6" height="8" />
      </>
    ),
  },
  chest: {
    name: "Комод",
    w: 120,
    h: 84,
    art: (
      <>
        <rect className={light} x="0" y="0" width="120" height="74" rx="2" />
        <rect className={dark} x="6" y="6" width="108" height="19" />
        <rect className={dark} x="6" y="29" width="108" height="19" />
        <rect className={dark} x="6" y="52" width="108" height="18" />
        <rect className={light} x="52" y="14" width="16" height="3" rx="1.5" />
        <rect className={light} x="52" y="37" width="16" height="3" rx="1.5" />
        <rect className={light} x="52" y="59" width="16" height="3" rx="1.5" />
        <rect className={dark} x="8" y="74" width="5" height="10" />
        <rect className={dark} x="107" y="74" width="5" height="10" />
      </>
    ),
  },
  bed: {
    name: "Кровать",
    w: 170,
    h: 110,
    art: (
      <>
        <rect className={dark} x="0" y="0" width="170" height="104" rx="7" />
        <rect className={light} x="6" y="62" width="158" height="42" rx="4" />
        <rect className={light} x="18" y="46" width="60" height="22" rx="9" />
        <rect className={light} x="92" y="46" width="60" height="22" rx="9" />
        <rect className={dark} x="8" y="104" width="6" height="6" />
        <rect className={dark} x="156" y="104" width="6" height="6" />
      </>
    ),
  },
};

/** Standing person, 175 cm tall and 60 cm across the arms. */
export const PERSON = { w: 60, h: 175 };

export function Person() {
  return (
    <>
      <ellipse cx="30" cy="11.5" rx="8.6" ry="11" />
      <path d="M26 19h8v10h-8z" />
      {/* torso */}
      <path d="M15 28.5c5-2.6 25-2.6 30 0 3.6 1.9 4.9 5.2 4.6 9.4L47.8 70c-.6 10-1.8 20.5-1.8 30H14c0-9.5-1.2-20-1.8-30l-1.8-32.1c-.3-4.2 1-7.5 4.6-9.4z" />
      {/* arms */}
      <path d="M12.2 30.4c-4.6 1.2-6.3 4.9-6.6 9.6L4 71.5c-.4 8.4 0 17.5.9 25.5.4 4 1.2 7.6 3.2 9 2 1.1 3.6-.8 3.4-4.3l-.4-6.3c.6-8.2 1.3-16.4 1.5-24.4l1.4-27.6z" />
      <path d="M47.8 30.4c4.6 1.2 6.3 4.9 6.6 9.6L56 71.5c.4 8.4 0 17.5-.9 25.5-.4 4-1.2 7.6-3.2 9-2 1.1-3.6-.8-3.4-4.3l.4-6.3c-.6-8.2-1.3-16.4-1.5-24.4l-1.4-27.6z" />
      {/* legs */}
      <path d="M14 98h32l-1.2 22.5-2.8 47.5c0 2.8 1.2 4.3 4.4 5.3 1.6.6 1.2 1.7-.8 1.7H33.4l-.6-7-1.4-47.5L30 108l-1.4 12.5-1.4 47.5-.6 7H14.4c-2 0-2.4-1.1-.8-1.7 3.2-1 4.4-2.5 4.4-5.3l-2.8-47.5z" />
    </>
  );
}
