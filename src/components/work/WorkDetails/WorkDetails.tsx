"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArtworkMorph } from "@/components/ui/ArtworkMorph/ArtworkMorph";
import { Button } from "@/components/ui/Button/Button";
import { Media } from "@/components/ui/Media/Media";
import { FRAMES, PRIMARY_PHONE, SPECS } from "@/content/site";
import { flyToOrder } from "@/features/order/fly-to-order";
import { order } from "@/features/order/store";
import { bem } from "@/lib/bem";
import type { ArtworkSize } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import s from "./WorkDetails.module.scss";

const b = bem(s, "work-details");

/** Pause between the landing in the header and the drawer opening, ms. */
const OPEN_AFTER_LANDING_MS = 450;

type Props = {
  code: string;
  /** Catalogue image path, saved with the request. */
  image: string;
  title: string;
  description: string;
  src: string;
  formatName: string;
  sizes: ArtworkSize[];
};

/** Artwork image + purchase panel: size, framing, "Добавить в заявку" (prototype "03 Работа"). */
export function WorkDetails({ code, image, title, description, src, formatName, sizes }: Props) {
  const [sizeIndex, setSizeIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const size = sizes[sizeIndex] ?? sizes[0];
  const imageRef = useRef<HTMLDivElement>(null);
  const flying = useRef(false);
  const openTimer = useRef(0);
  useEffect(() => () => clearTimeout(openTimer.current), []);

  // The artwork flies into the header «Заявка» first; the line is added as it lands, the drawer
  // opens a moment later (not if the visitor has left the page). Without motion, at once. Presses
  // during the flight are ignored, so it adds one line.
  const addToOrder = async (e: MouseEvent<HTMLButtonElement>) => {
    if (flying.current) return;
    const item = {
      code,
      title,
      src,
      img: image,
      w: size?.w ?? null,
      h: size?.h ?? null,
      size: size ? `${size.w}×${size.h} см` : "на заказ",
      price: size?.p ?? null,
      frame: FRAMES[frameIndex].n,
      frameIndex,
    };
    flying.current = true;
    const flew = await flyToOrder(imageRef.current?.querySelector("img"), e.currentTarget);
    flying.current = false;
    order.add(item, { open: !flew });
    if (flew) openTimer.current = window.setTimeout(order.open, OPEN_AFTER_LANDING_MS);
  };

  const rows = sizes.length
    ? sizes.map((z, i) => ({ label: `${z.w} × ${z.h} см`, price: formatPrice(z.p), selected: i === sizeIndex, pick: () => setSizeIndex(i) }))
    : [{ label: "Размер на заказ", price: "по запросу", selected: true, pick: () => {} }];

  return (
    <section className={b()}>
      {/* No reveal on the photo: it arrives morphing from the card that was clicked. */}
      <div ref={imageRef} className={b("image")}>
        <ArtworkMorph code={code}>
          <Media src={src} alt={title} sizes="(width >= 960px) 50vw, 100vw" className={b("media")} imgClassName={b("image-img")} eager />
        </ArtworkMorph>
      </div>

      <div className={b("info")} data-reveal>
        <div className={b("intro")}>
          <span className={b("meta")}>
            {code} · Kuznetsovs Gallery · {formatName}
          </span>
          <h1 className={b("title")}>{title}</h1>
          <p className={b("description")}>{description}</p>
        </div>

        <div className={b("sizes")}>
          <div className={b("sizes-head")}>
            <span>Размер</span>
            <span>Цена</span>
          </div>
          {rows.map((r) => (
            <button key={r.label} type="button" className={b("size", { selected: r.selected })} onClick={r.pick}>
              <span className={b("size-label")}>
                <span className={b("dot")} />
                {r.label}
              </span>
              <span className={b("size-price")}>{r.price}</span>
            </button>
          ))}
        </div>

        <div className={b("framing")}>
          <span className={b("label")}>Оформление</span>
          <div className={b("frames")}>
            {FRAMES.map((f, i) => (
              <button key={f.n} type="button" className={b("frame", { selected: i === frameIndex })} onClick={() => setFrameIndex(i)}>
                <Media src={f.img} sizes="160px" className={b("frame-media")} imgClassName={b("frame-img")} />
                <span className={b("frame-name")}>{f.n}</span>
                <span className={b("frame-note")}>{f.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={b("actions")}>
          {/* Label and price are separate flex items, as in the prototype. */}
          <Button size="lg" icon="plus" onClick={addToOrder}>
            Добавить в заявку ·{" "}
            <span>{formatPrice(size?.p)}</span>
          </Button>
          <Button href={PRIMARY_PHONE.href} variant="outline" size="lg" regular icon="phone" iconSize={14}>
            Позвонить
          </Button>
        </div>

        <div className={b("specs")}>
          {SPECS.map((sp) => (
            <div key={sp.k} className={b("spec")}>
              <span className={b("spec-key")}>{sp.k}</span>
              <span className={b("spec-value")}>{sp.v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
