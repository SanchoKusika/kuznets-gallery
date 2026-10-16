import { bem } from "@/lib/bem";
import s from "./GalleryMap.module.scss";

const b = bem(s, "map");

/**
 * Stands in for the footer map until it is ready: the scheme's background, the accent crosshair
 * and the gallery pin, where the live map puts them, so the map just fades in underneath.
 */
export function MapPlaceholder({ hidden }: { hidden: boolean }) {
  return (
    <div className={b("placeholder", { hidden })} aria-hidden="true">
      <div className={b("pin")}>
        <div className={b("pin-pulse")} />
        <div className={b("pin-dot")} />
        <div className={b("pin-label")}>Kuznetsovs Gallery</div>
      </div>
    </div>
  );
}
