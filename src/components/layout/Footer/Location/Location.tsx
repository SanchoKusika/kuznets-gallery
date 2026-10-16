"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import { LOCATION } from "@/content/site";
import { METRO } from "@/features/map/places";
import { useGalleryMap } from "@/features/map/useGalleryMap";
import { bem } from "@/lib/bem";
import s from "./Location.module.scss";

const b = bem(s, "location");

/**
 * Footer «Как нас найти»: address, nearest metro, navigator links and the styled map. `children`
 * (the footer's link columns) go under the address; from 900px the map spans both. `mapKey` is
 * the Yandex Maps key, read on the server (`YANDEX_MAPS_KEY`).
 */
export function Location({ mapKey, children }: { mapKey: string | undefined; children: ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { map, failed } = useGalleryMap(canvasRef, mapKey);

  return (
    <div className={b()}>
      <div className={b("info")}>
        <div className={b("address")}>
          <span className={b("label")}>Как нас найти</span>
          <span className={b("title")}>{LOCATION.title}</span>
          <div className={b("lines")}>
            {LOCATION.lines.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>

        <div className={b("metro")}>
          <span className={b("label", { small: true, metro: true })}>Метро · по прямой</span>
          {METRO.map((st, i) => (
            <button
              key={st.n}
              type="button"
              className={b("station")}
              onClick={() => map.current?.show(st)}
              onPointerEnter={() => map.current?.highlight(i, true)}
              onPointerLeave={() => map.current?.highlight(i, false)}
            >
              <span className={b("station-badge")}>М</span>
              <span className={b("station-name")}>{st.n}</span>
              <span className={b("station-distance")}>{st.d}</span>
            </button>
          ))}
        </div>

        <div className={b("navigators")}>
          <span className={b("label", { small: true })}>Открыть в навигаторе</span>
          <div className={b("links")}>
            {LOCATION.navigators.map((n, i) => (
              <a key={n.href} href={n.href} target="_blank" rel="noopener" className={b("link", { primary: i === 0 })}>
                {n.n}
                <Icon name="arrow-up-right" size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={b("frame")}>
        <div ref={canvasRef} className={b("canvas")} />
        <div className={b("coords")}>
          <span className={b("coords-dot")} />
          {LOCATION.coords}
        </div>
        <div className={b("controls")}>
          <button type="button" aria-label="Приблизить" className={b("control")} onClick={() => map.current?.zoomIn()}>
            <Icon name="plus" />
          </button>
          <button type="button" aria-label="Отдалить" className={b("control")} onClick={() => map.current?.zoomOut()}>
            <Icon name="minus" />
          </button>
          <button
            type="button"
            aria-label="К галерее"
            title="К галерее"
            className={b("control")}
            onClick={() => map.current?.recenter()}
          >
            <Icon name="locate" />
          </button>
        </div>
        {failed && <div className={b("fail")}>Карта не загрузилась — откройте адрес в навигаторе</div>}
      </div>

      <div className={b("extra")}>{children}</div>
    </div>
  );
}
