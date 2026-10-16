import { bem } from "@/lib/bem";
import { PIN_CLASS, PIN_HTML } from "./pin";
import s from "./GalleryMap.module.scss";

const b = bem(s, "map");

/**
 * Stands in for the footer map until it is ready: the scheme's background, the accent crosshair
 * and the gallery pin, where the live map puts them, so the map just fades in underneath.
 */
export function MapPlaceholder({ hidden }: { hidden: boolean }) {
  return (
    <div className={b("placeholder", { hidden })} aria-hidden="true">
      <div className={PIN_CLASS} dangerouslySetInnerHTML={{ __html: PIN_HTML }} />
    </div>
  );
}
