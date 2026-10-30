"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Media } from "@/components/ui/Media/Media";
import { SizeList } from "@/components/ui/SizeList/SizeList";
import { FRAMES, PRIMARY_PHONE, SPECS } from "@/content/site";
import { dropHandoff, handedOff } from "@/features/catalog/card-picture";
import { useAddToOrder } from "@/features/order/use-add-to-order";
import { bem } from "@/lib/bem";
import type { ArtworkSize } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import s from "./WorkDetails.module.scss";

const b = bem(s, "work-details");

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
  // Opened from its card: the card's picture stands in until the photo loads, then goes.
  const [placeholder, setPlaceholder] = useState(() => handedOff(code));
  useEffect(dropHandoff, []);
  const add = useAddToOrder();

  const addToOrder = (e: MouseEvent<HTMLButtonElement>) => {
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
    add(item, imageRef.current?.querySelector("img:last-of-type"), e.currentTarget);
  };

  const rows = sizes.length
    ? sizes.map((z, i) => ({ label: `${z.w} × ${z.h} см`, price: formatPrice(z.p), selected: i === sizeIndex, pick: () => setSizeIndex(i) }))
    : [{ label: "Размер на заказ", price: "по запросу", selected: true, pick: () => {} }];

  return (
    <section className={b()} data-reveal>
      <div ref={imageRef} className={b("image")}>
        <Media src={src} alt={`«${title}» — принт-картина на холсте`} sizes="(width >= 960px) 50vw, 100vw" className={b("media")} imgClassName={b("image-img")} placeholder={placeholder} onLoad={() => setPlaceholder(undefined)} eager />
      </div>

      <div className={b("info")}>
        <div className={b("intro")}>
          <span className={b("meta")}>
            {code} · Kuznetsovs Gallery · {formatName}
          </span>
          <h1 className={b("title")}>{title}</h1>
          <p className={b("description")}>{description}</p>
        </div>

        <SizeList rows={rows} />

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
