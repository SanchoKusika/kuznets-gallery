"use client";

import { useState } from "react";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { Drawer, DrawerLabel } from "@/components/admin/ui/Drawer/Drawer";
import { Field } from "@/components/admin/ui/Field/Field";
import { SearchField } from "@/components/admin/ui/SearchField/SearchField";
import { Thumb } from "@/components/admin/ui/Thumb/Thumb";
import { count, dstr, fmtP, hm, PICTURES } from "@/features/admin/format";
import { FRAME_NAMES, SOURCES, STATUSES, digits, minPrice, reqTotal, type Source } from "@/features/admin/model";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import type { RequestItem } from "@/lib/request";
import s from "./RequestDrawer.module.scss";

const b = bem(s, "request-card");

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M8 6V4h8v2" />
  </svg>
);

/** Request card in the drawer: status, client, items, due date, comment and manager notes; saves as you type. */
export function RequestDrawer({ open, id }: { open: boolean; id: string | null }) {
  const { requests, products, updateReq, setStatus, deleteReq, closeDrawer } = useAdmin();
  const r = requests.find((x) => x.id === id);
  const [picking, setPicking] = useState(false);
  const [pq, setPq] = useState("");
  const [note, setNote] = useState("");
  const [seenId, setSeenId] = useState(id);
  // A newly opened request starts with the search closed and an empty note (prototype openReq).
  if (id !== seenId) {
    setSeenId(id);
    setPicking(false);
    setPq("");
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
  const total = reqTotal(r);
  const phone = digits(r.phone);
  const query = pq.trim().toLowerCase();
  const results = products.filter((p) => !query || `${p.title} ${p.code}`.toLowerCase().includes(query)).slice(0, 6);
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
        <span>{r.items.length ? count(r.items.reduce((a, i) => a + (i.qty || 1), 0), PICTURES) : ""}</span>
      </DrawerLabel>
      <div className={b("items")}>
        {r.items.map((it, i) => {
          const prod = products.find((p) => p.code === it.code);
          const v = it.w ? `${it.w}x${it.h}` : "";
          const opts = (prod?.sizes ?? []).map((z) => ({ v: `${z.w}x${z.h}`, l: `${z.w} × ${z.h} см · ${fmtP(z.price)}` }));
          if (!opts.some((o) => o.v === v)) opts.unshift({ v, l: v ? `${it.w} × ${it.h} см` : "Размер по запросу" });
          return (
            <div key={i} className={b("item")}>
              <Thumb image={it.image} sizes="64px" className={b("item-thumb")} />
              <div className={b("item-body")}>
                <div className={b("item-head")}>
                  <div className={b("item-name")}>
                    <div className={b("item-title")}>{it.title}</div>
                    <div className={b("item-code")}>{it.code || "—"}</div>
                  </div>
                  <button type="button" className={b("item-remove")} aria-label="Убрать" onClick={() => upd((x) => ({ items: x.items.filter((_, j) => j !== i) }))}>
                    ✕
                  </button>
                </div>
                <div className={b("item-controls")}>
                  <select
                    className={b("item-select")}
                    aria-label="Размер"
                    value={v}
                    onChange={(e) => {
                      const z = prod?.sizes.find((z) => `${z.w}x${z.h}` === e.target.value);
                      if (z) updItem(i, { w: z.w, h: z.h, price: z.price });
                    }}
                  >
                    {opts.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                  <select className={b("item-select")} aria-label="Оформление" value={FRAME_NAMES.includes(it.frame) ? it.frame : FRAME_NAMES[0]} onChange={(e) => updItem(i, { frame: e.target.value })}>
                    {FRAME_NAMES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <div className={b("qty")}>
                    <button type="button" className={b("qty-button")} aria-label="Меньше" onClick={() => updItem(i, { qty: Math.max(1, (it.qty || 1) - 1) })}>
                      −
                    </button>
                    <span className={b("qty-value")}>{it.qty || 1}</span>
                    <button type="button" className={b("qty-button")} aria-label="Больше" onClick={() => updItem(i, { qty: (it.qty || 1) + 1 })}>
                      +
                    </button>
                  </div>
                  <span className={b("item-line")}>{it.price == null ? "по запросу" : fmtP(it.price * (it.qty || 1))}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {picking && (
        <div className={b("picker")}>
          <SearchField value={pq} onChange={setPq} placeholder="Найти картину по названию или коду" />
          {results.map((p) => {
            const mp = minPrice(p);
            return (
              <button
                key={p.code}
                type="button"
                className={b("result")}
                onClick={() => {
                  const z = p.sizes[0];
                  upd((x) => ({ items: [...x.items, { code: p.code, title: p.title, image: p.image, w: z?.w ?? null, h: z?.h ?? null, price: z?.price ?? null, frame: FRAME_NAMES[0], qty: 1 }] }));
                  setPicking(false);
                  setPq("");
                }}
              >
                <Thumb image={p.image} sizes="40px" className={b("result-thumb")} />
                <span className={b("result-title")}>
                  {p.title}
                  <span className={b("result-code")}>{p.code}</span>
                </span>
                <span className={b("result-price")}>{mp != null ? `от ${fmtP(mp)}` : "по запросу"}</span>
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className={b("pick")}
        onClick={() => {
          setPicking((v) => !v);
          setPq("");
        }}
      >
        {picking ? "Скрыть поиск" : "+ Добавить картину"}
      </button>
      <div className={b("total")}>
        <div>
          <div className={b("total-label")}>Итого</div>
          <div className={b("total-note")}>{total.q ? "Часть позиций — цена по запросу" : "Доставка и оформление — отдельно"}</div>
        </div>
        <div className={b("total-value")}>{total.t ? fmtP(total.t) : "по запросу"}</div>
      </div>

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
