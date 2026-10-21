"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/Button/Button";
import { SizeList } from "@/components/ui/SizeList/SizeList";
import { WorkLink } from "@/components/ui/WorkLink/WorkLink";
import { FRAMES } from "@/content/site";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { useAddToOrder } from "@/features/order/use-add-to-order";
import { bem } from "@/lib/bem";
import { formatPrice } from "@/lib/format";
import { isForeign } from "@/lib/images";
import type { TryOnWork } from "./pick";
import { FURNITURE, PERSON, Person, type FurnitureKey } from "./scene";
import s from "./TryOn.module.scss";

const b = bem(s, "try-on");

/** The scene in cm (the wall's width and the furniture's centre are set in CSS per breakpoint). */
const SCENE = {
  height: 270,
  floor: 6,
  /** Eye level: where the centre of a picture goes. */
  eye: 150,
  /** Least gap between furniture and a picture. */
  gap: 22,
  /** A picture's top stays below this. */
  top: 262,
  /** Margin between a picture and the wall's sides. */
  edge: 4,
};
/** Room for the height dimension on the picture's right, px. */
const DIMENSION_ROOM = 28;
/** Step of the arrow keys, cm. */
const STEP = 10;

const WALLS = [
  { k: "plaster", name: "Светлая штукатурка" },
  { k: "sage", name: "Шалфей" },
  { k: "clay", name: "Глина" },
  { k: "graphite", name: "Графит" },
] as const;
type WallKey = (typeof WALLS)[number]["k"];

/** Wall width and the furniture's centre in cm, and cm per screen pixel. */
const wallGeometry = (el: HTMLElement) => {
  const css = getComputedStyle(el);
  const width = parseFloat(css.getPropertyValue("--wall-cm"));
  return { width, centre: parseFloat(css.getPropertyValue("--centre-cm")), cmPerPx: width / el.clientWidth };
};

const defaultSize = (w: TryOnWork) => Math.min(1, w.sizes.length - 1);

/**
 * «Примерьте размер»: a wall drawn to scale (4.2 m, 3 m on phones) with furniture and a 175 cm person.
 * The picked work hangs at its real size, centred at eye level or at least 22 cm above the furniture
 * (as long as it stays under 2.62 m), and can be dragged along the wall — it swings on its nail.
 * «В заявку» adds the shown size, as on the work page.
 */
export function TryOn({ works }: { works: TryOnWork[] }) {
  const [workIndex, setWorkIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(() => defaultSize(works[0]));
  const [furniture, setFurniture] = useState<FurnitureKey>("sofa");
  const [wall, setWall] = useState<WallKey>("plaster");
  /** Offset of the picture's centre from the furniture's centre, cm. */
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const wallRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; from: number; cmPerPx: number; lastX: number; lastT: number } | null>(null);
  const add = useAddToOrder();

  const work = works[workIndex] ?? works[0];
  const size = work.sizes[sizeIndex] ?? work.sizes[0];
  const item = FURNITURE[furniture];
  const centreY = Math.min(Math.max(SCENE.eye, item.h + SCENE.gap + size.h / 2), SCENE.top - size.h / 2);

  /** Keeps the picture on the wall, with room for its height dimension on the right. */
  const clampOffset = (value: number) => {
    const el = wallRef.current;
    if (!el) return value;
    const { width, centre, cmPerPx } = wallGeometry(el);
    const min = size.w / 2 + SCENE.edge - centre;
    const max = width - size.w / 2 - Math.max(SCENE.edge, DIMENSION_ROOM * cmPerPx) - centre;
    return Math.max(min, Math.min(max, value));
  };

  const pickWork = (i: number) => {
    setWorkIndex(i);
    setSizeIndex(defaultSize(works[i]));
    setOffset(0);
  };

  const swing = (deg: number) => {
    if (artRef.current) artRef.current.style.rotate = `${deg}deg`;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = wallRef.current;
    if (!el || !e.isPrimary) return;
    drag.current = { x: e.clientX, from: clampOffset(offset), cmPerPx: wallGeometry(el).cmPerPx, lastX: e.clientX, lastT: e.timeStamp };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setOffset(clampOffset(d.from + (e.clientX - d.x) * d.cmPerPx));
    // The picture leans against the motion, harder the faster it goes.
    const speed = (e.clientX - d.lastX) / Math.max(1, e.timeStamp - d.lastT);
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    if (prefersMotion()) swing(Math.max(-9, Math.min(9, -speed * 6)));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    swing(0);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowLeft" ? -STEP : e.key === "ArrowRight" ? STEP : 0;
    if (!step) return;
    e.preventDefault();
    setOffset((v) => clampOffset(clampOffset(v) + step));
  };

  const addToOrder = (e: MouseEvent<HTMLButtonElement>) => {
    const line = {
      code: work.code,
      title: work.title,
      src: work.src,
      img: work.image,
      w: size.w,
      h: size.h,
      size: `${size.w}×${size.h} см`,
      price: size.p,
      frame: FRAMES[0].n,
      frameIndex: 0,
    };
    add(line, artRef.current?.querySelector("img"), e.currentTarget);
  };

  const sizeRows = work.sizes.map((z, i) => ({ label: `${z.w} × ${z.h} см`, price: formatPrice(z.p), selected: i === sizeIndex, pick: () => setSizeIndex(i) }));

  const wallVars = {
    "--wall-h": SCENE.height,
    "--floor": SCENE.floor,
    "--eye": SCENE.eye,
    "--edge": SCENE.edge,
    "--dimension-room": `${DIMENSION_ROOM}px`,
    "--person-w": PERSON.w,
    "--person-h": PERSON.h,
    "--furniture-w": item.w,
    "--furniture-h": item.h,
  } as CSSProperties;
  const artVars = { "--w": size.w, "--h": size.h, "--offset": offset, "--bottom": centreY - size.h / 2 + SCENE.floor } as CSSProperties;

  return (
    <section className={b()} data-reveal>
      <div className={b("head")}>
        <h2 className={b("title")}>Примерьте размер</h2>
        <p className={b("lede")}>Выберите работу и формат — покажем, как он смотрится на стене в масштабе.</p>
      </div>

      <div className={b("body")}>
        <div className={b("panel")}>
          <div className={b("group")}>
            <span className={b("label")}>Работа</span>
            <div className={b("works")}>
              {works.map((w, i) => (
                <button key={w.code} type="button" className={b("work", { selected: i === workIndex })} aria-pressed={i === workIndex} aria-label={w.title} title={w.title} onClick={() => pickWork(i)}>
                  <Image src={w.flatSrc} alt="" width={120} height={120} sizes="(width >= 960px) 56px, 18vw" className={b("work-img")} unoptimized={isForeign(w.flatSrc)} />
                </button>
              ))}
            </div>
          </div>

          <SizeList rows={sizeRows} />

          <div className={b("options")}>
            <div className={b("group")}>
              <span className={b("label")}>Под картиной</span>
              <div className={b("chips")}>
                {(Object.keys(FURNITURE) as FurnitureKey[]).map((k) => (
                  <button key={k} type="button" className={b("chip", { selected: k === furniture })} aria-pressed={k === furniture} onClick={() => setFurniture(k)}>
                    {FURNITURE[k].name}
                  </button>
                ))}
              </div>
            </div>
            <div className={b("group")}>
              <span className={b("label")}>Стена</span>
              <div className={b("chips")}>
                {WALLS.map((w) => (
                  <button key={w.k} type="button" className={b("swatch", { [w.k]: true, selected: w.k === wall })} aria-pressed={w.k === wall} aria-label={w.name} title={w.name} onClick={() => setWall(w.k)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={b("stage")}>
          <div ref={wallRef} className={b("wall", { [wall]: true })} style={wallVars}>
            <div className={b("eye")}>
              <span className={b("eye-label")}>{SCENE.eye} см — уровень глаз</span>
            </div>
            <svg className={b("furniture")} viewBox={`0 0 ${item.w} ${item.h}`} preserveAspectRatio="none" aria-hidden="true">
              {item.art}
            </svg>
            <svg className={b("person")} viewBox={`0 0 ${PERSON.w} ${PERSON.h}`} aria-hidden="true">
              <Person />
            </svg>
            <span className={b("person-label")}>{PERSON.h} см</span>
            <div
              ref={artRef}
              className={b("art", { dragging })}
              style={artVars}
              role="img"
              aria-label={`«${work.title}», ${size.w} × ${size.h} см; стрелками можно сдвинуть по стене`}
              tabIndex={0}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={onKeyDown}
            >
              <Image key={work.code} src={work.flatSrc} alt="" fill sizes="(width >= 960px) 30vw, 60vw" className={b("art-img")} unoptimized={isForeign(work.flatSrc)} draggable={false} />
              <span className={b("dim", { width: true })}>
                <span className={b("dim-text")}>{size.w} см</span>
              </span>
              <span className={b("dim", { height: true })}>
                <span className={b("dim-text")}>{size.h} см</span>
              </span>
            </div>
            <span className={b("hint")}>Картину можно двигать</span>
          </div>

          <div className={b("summary")}>
            <div className={b("summary-text")}>
              <span className={b("summary-title")}>«{work.title}»</span>
              <span className={b("summary-meta")}>
                {size.w} × {size.h} см · холст на подрамнике · {formatPrice(size.p)}
              </span>
            </div>
            <div className={b("actions")}>
              <WorkLink href={work.href} className={b("link")}>
                Смотреть работу →
              </WorkLink>
              <Button icon="plus" onClick={addToOrder}>
                В заявку
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
