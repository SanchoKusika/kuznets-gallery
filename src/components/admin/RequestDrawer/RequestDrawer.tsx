"use client";

import { useMemo, useState } from "react";
import { CatalogPicker } from "@/components/admin/CatalogPicker/CatalogPicker";
import { ItemThumb } from "@/components/admin/ItemThumb/ItemThumb";
import { OrderTotal } from "@/components/admin/OrderTotal/OrderTotal";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { Drawer, DrawerLabel } from "@/components/admin/ui/Drawer/Drawer";
import { Field } from "@/components/admin/ui/Field/Field";
import { NumInput } from "@/components/admin/ui/NumInput/NumInput";
import { PillSelect } from "@/components/admin/ui/PillSelect/PillSelect";
import { count, dstr, fmtP, hm, num, PICTURES } from "@/features/admin/format";
import { FRAME_NAMES, SOURCES, STATUSES, digits, isCustom, lineTotal, pieces, separateFrame, type Source } from "@/features/admin/model";
import { CUSTOM_TITLE, customItem, fromProduct, lineId, priceList, resize } from "@/features/admin/order";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { plural } from "@/lib/format";
import type { RequestItem } from "@/lib/request";
import s from "./RequestDrawer.module.scss";

const b = bem(s, "request-card");

/** Longer orders show a summary here and are edited on the whole screen. */
const DRAWER_ITEMS = 8;
const FRAME_OPTIONS = FRAME_NAMES.map((f) => ({ v: f, l: f }));

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M8 6V4h8v2" />
  </svg>
);

/** Request card in the drawer: status, client, items, due date, comment and manager notes; saves as you type. */
export function RequestDrawer({ open, id }: { open: boolean; id: string | null }) {
  const { requests, products, updateReq, setStatus, deleteReq, closeDrawer, openOrder, orderId } = useAdmin();
  const prices = useMemo(() => priceList(products), [products]);
  const found = requests.find((x) => x.id === id);
  // A deleted request keeps its card on screen while the drawer slides out.
  const [last, setLast] = useState(found);
  if (found && found !== last) setLast(found);
  const r = found ?? (last?.id === id ? last : undefined);
  const [picking, setPicking] = useState(false);
  const [note, setNote] = useState("");
  const [seenId, setSeenId] = useState(id);
  // A newly opened request starts with the search closed and an empty note (prototype openReq).
  if (id !== seenId) {
    setSeenId(id);
    setPicking(false);
    setNote("");
  }
  if (!open && picking) setPicking(false);

  if (!r)
    return (
      <Drawer open={false} onClose={closeDrawer} head="" footer={null}>
        {null}
      </Drawer>
    );

  const upd = (patch: Parameters<typeof updateReq>[1]) => updateReq(r.id, patch);
  const updItem = (i: number, patch: Partial<RequestItem>) => upd((x) => ({ items: x.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const cur = STATUSES.findIndex((x) => x.k === r.status);
  const phone = digits(r.phone);
  const long = r.items.length > DRAWER_ITEMS;
  const custom = r.items.filter(isCustom).length;
  const addNote = () => {
    const text = note.trim();
    if (!text) return;
    upd((x) => ({ notes: [...x.notes, { at: Date.now(), text }] }));
    setNote("");
  };

  return (
    <Drawer
      open={open}
      onClose={closeDrawer}
      head={`Заявка № ${r.no} · ${dstr(r.at)}, ${hm(r.at)}`}
      footer={
        <>
          <button type="button" className={b("delete")} onClick={() => deleteReq(r.id)}>
            <TrashIcon />
            Удалить заявку
          </button>
          <div className={b("done")}>
            <span className={b("autosave")}>Сохраняется сразу</span>
            <DsButton onClick={closeDrawer}>Готово</DsButton>
          </div>
        </>
      }
    >
      <h2 className={b("title")}>{r.name || "Без имени"}</h2>
      <div className={b("steps")}>
        {STATUSES.filter((x) => x.k !== "cancel").map((x, i) => (
          <button
            key={x.k}
            type="button"
            className={b("step", { current: x.k === r.status, past: r.status !== "cancel" && i < cur })}
            aria-pressed={x.k === r.status}
            onClick={() => setStatus(r.id, x.k)}
          >
            {x.n}
          </button>
        ))}
      </div>
      <button type="button" className={b("cancel")} onClick={() => setStatus(r.id, r.status === "cancel" ? "contact" : "cancel")}>
        {r.status === "cancel" ? "Заявка отменена — вернуть в работу" : "Отменить заявку"}
      </button>

      <DrawerLabel>Клиент</DrawerLabel>
      <div className={b("grid")}>
        <Field label="Имя">
          <input className={b("input")} value={r.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Как обращаться" />
        </Field>
        <Field label="Компания">
          <input className={b("input")} value={r.company} onChange={(e) => upd({ company: e.target.value })} placeholder="Для B2B-заказов" />
        </Field>
        <Field label="Телефон">
          <input className={b("input", { phone: true })} value={r.phone} onChange={(e) => upd({ phone: e.target.value })} inputMode="tel" />
        </Field>
        <Field label="Источник">
          <select className={b("input", { select: true })} value={r.source} onChange={(e) => upd({ source: e.target.value as Source })}>
            {SOURCES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className={b("contacts")}>
        <a href={`tel:+${phone}`} className={b("contact", { call: true })}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
          </svg>
          Позвонить
        </a>
        <a href={`https://t.me/+${phone}`} target="_blank" rel="noreferrer" className={b("contact")}>
          Telegram
        </a>
        <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className={b("contact")}>
          WhatsApp
        </a>
      </div>

      <DrawerLabel gap={40}>
        <span>Состав заказа</span>
        <span>{r.items.length ? count(pieces(r.items), PICTURES) : ""}</span>
      </DrawerLabel>
      {long && (
        <div className={b("summary")}>
          <span className={b("summary-text")}>
            {`${r.items.length} ${plural(r.items.length, "позиция", "позиции", "позиций")}`}
            {custom ? ` · ${custom} ${plural(custom, "свой принт", "своих принта", "своих принтов")}` : ""}
          </span>
          <span className={b("summary-what")}>{r.items.slice(0, 3).map((i) => i.title).join(", ") + (r.items.length > 3 ? "…" : "")}</span>
        </div>
      )}
      <div className={b("items")}>
        {(long ? [] : r.items).map((it, i) => {
          const own = isCustom(it);
          const prod = own ? undefined : products.find((p) => p.code === it.code);
          const v = it.w ? `${it.w}x${it.h}` : "";
          const opts = (prod?.sizes ?? []).map((z) => ({ v: `${z.w}x${z.h}`, l: `${z.w} × ${z.h} см · ${fmtP(z.price)}` }));
          if (!opts.some((o) => o.v === v)) opts.unshift({ v, l: v ? `${it.w} × ${it.h} см` : "Размер по запросу" });
          return (
            <div key={i} className={b("item")}>
              <ItemThumb
                image={it.image}
                sizes="64px"
                className={b("item-thumb")}
                onUpload={
                  own
                    ? () => {
                        // The line may move while the picture goes up: it gets an id, the picture goes to the line with it.
                        const lid = it.id ?? lineId();
                        if (!it.id) updItem(i, { id: lid });
                        return (image) => upd((x) => ({ items: x.items.map((y) => (y.id === lid ? { ...y, image } : y)) }));
                      }
                    : undefined
                }
              />
              <div className={b("item-body")}>
                <div className={b("item-head")}>
                  <div className={b("item-name")}>
                    {own ? (
                      <input className={b("item-title", { input: true })} value={it.title} onChange={(e) => updItem(i, { title: e.target.value.slice(0, 200) })} placeholder={CUSTOM_TITLE} aria-label="Название" />
                    ) : (
                      <div className={b("item-title")}>{it.title}</div>
                    )}
                    <div className={b("item-code")}>{own ? CUSTOM_TITLE : it.code}</div>
                  </div>
                  <button type="button" className={b("item-remove")} aria-label="Убрать" onClick={() => upd((x) => ({ items: x.items.filter((_, j) => j !== i) }))}>
                    ✕
                  </button>
                </div>
                <div className={b("item-controls")}>
                  {own ? (
                    <>
                      <span className={b("pill")}>
                        <NumInput className={b("pill-input", { size: true })} value={it.w} onChange={(w) => updItem(i, resize(prices, it, w, it.h))} digits={4} placeholder="Ш" aria-label="Ширина, см" />
                        ×
                        <NumInput className={b("pill-input", { size: true })} value={it.h} onChange={(h) => updItem(i, resize(prices, it, it.w, h))} digits={4} placeholder="В" aria-label="Высота, см" />
                        см
                      </span>
                      <span className={b("pill", { empty: it.price == null })}>
                        <NumInput className={b("pill-input")} value={it.price} onChange={(price) => updItem(i, { price })} placeholder="цена за шт." aria-label="Цена за штуку" />
                        сум
                      </span>
                    </>
                  ) : (
                    <PillSelect
                      size="sm"
                      aria-label="Размер"
                      options={opts}
                      value={v}
                      onChange={(val) => {
                        const z = prod?.sizes.find((z) => `${z.w}x${z.h}` === val);
                        if (z) updItem(i, { w: z.w, h: z.h, price: z.price });
                      }}
                    />
                  )}
                  <PillSelect
                    size="sm"
                    aria-label="Оформление"
                    options={FRAME_OPTIONS}
                    value={FRAME_NAMES.includes(it.frame) ? it.frame : FRAME_NAMES[0]}
                    // Back to the canvas on a stretcher: its framing is in the price, the entered sum goes.
                    onChange={(frame) => updItem(i, { frame, ...(frame === FRAME_NAMES[0] && { framePrice: null }) })}
                  />
                  {separateFrame(it) && (
                    <label className={b("frame-price", { empty: it.framePrice == null })} title="Оформление за штуку: багет или рамка со стеклом считаются отдельно">
                      <span>+</span>
                      <input
                        className={b("frame-input")}
                        value={it.framePrice == null ? "" : num(it.framePrice)}
                        onChange={(e) => {
                          const d = digits(e.target.value).slice(0, 9); // the server takes up to 999 999 999
                          updItem(i, { framePrice: d ? +d : null });
                        }}
                        inputMode="numeric"
                        placeholder="оформление"
                        aria-label="Цена оформления за штуку"
                      />
                      <span>сум</span>
                    </label>
                  )}
                  <div className={b("qty")}>
                    <button type="button" className={b("qty-button")} aria-label="Меньше" onClick={() => updItem(i, { qty: Math.max(1, (it.qty || 1) - 1) })}>
                      −
                    </button>
                    <span className={b("qty-value")}>{it.qty || 1}</span>
                    <button type="button" className={b("qty-button")} aria-label="Больше" onClick={() => updItem(i, { qty: Math.min(9999, (it.qty || 1) + 1) })}>
                      +
                    </button>
                  </div>
                  <span className={b("item-line")}>{fmtP(lineTotal(it))}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {picking && !long && (
        <CatalogPicker
          onPick={(p) => {
            upd((x) => ({ items: [...x.items, fromProduct(p)] }));
            setPicking(false);
          }}
        />
      )}
      <div className={b("adds")}>
        {!long && (
          <>
            <button type="button" className={b("pick")} onClick={() => setPicking((v) => !v)}>
              {picking ? "Скрыть поиск" : "+ Добавить картину"}
            </button>
            <button type="button" className={b("pick")} title="Картина не из каталога: своё название, размер и цена" onClick={() => upd((x) => ({ items: [...x.items, customItem(prices)] }))}>
              + Свой принт
            </button>
          </>
        )}
        {orderId !== r.id && (
          <button type="button" className={b("pick", { open: true })} onClick={() => openOrder(r.id)}>
            {long ? "Открыть состав заказа →" : "На весь экран →"}
          </button>
        )}
      </div>
      <OrderTotal r={r} />

      <DrawerLabel gap={40}>Детали</DrawerLabel>
      <div className={b("grid")}>
        <Field label="Срок готовности">
          <input type="date" className={b("input", { date: true })} value={r.due} onChange={(e) => upd({ due: e.target.value })} />
        </Field>
        <div className={b("static")}>
          <span className={b("static-label")}>Производство</span>
          <span className={b("static-value")}>3–7 дней после утверждения макета</span>
        </div>
      </div>
      <Field label="Комментарий клиента" className={b("comment")}>
        <textarea className={b("input", { comment: true })} value={r.comment} onChange={(e) => upd({ comment: e.target.value })} rows={2} placeholder="—" />
      </Field>

      <DrawerLabel gap={40}>
        <span>Заметки менеджера</span>
        <span>{r.notes.length || ""}</span>
      </DrawerLabel>
      <div className={b("notes")}>
        {[...r.notes].reverse().map((n, i) => (
          <div key={i} className={b("note")}>
            <span className={b("note-when")}>
              {`${dstr(n.at)}, ${hm(n.at)}`}
            </span>
            <span className={b("note-text")}>{n.text}</span>
          </div>
        ))}
      </div>
      <div className={b("note-form")}>
        <textarea className={b("input", { note: true })} value={note} onChange={(e) => setNote(e.target.value)} rows={1} placeholder="Например: отправили макет в Telegram" aria-label="Новая заметка" />
        <DsButton variant="secondary" size="sm" onClick={addNote}>
          Добавить
        </DsButton>
      </div>
    </Drawer>
  );
}
