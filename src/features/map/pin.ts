import { bem } from "@/lib/bem";
import s from "./GalleryMap.module.scss";

const b = bem(s, "map");

/** The gallery pin (pulsing ring, dot, name pill): one markup for the live map and its placeholder. */
export const PIN_CLASS = b("pin");
export const PIN_HTML = `<div class="${b("pin-pulse")}"></div><div class="${b("pin-dot")}"></div><div class="${b("pin-label")}">Kuznetsovs Gallery</div>`;
