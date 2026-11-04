"use client";

import { memo, useCallback, useEffect, useEffectEvent, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { CatalogPicker } from "@/components/admin/CatalogPicker/CatalogPicker";
import { ItemThumb } from "@/components/admin/ItemThumb/ItemThumb";
import { OrderTotal } from "@/components/admin/OrderTotal/OrderTotal";
import { Chip } from "@/components/admin/ui/Chip/Chip";
import { NumInput } from "@/components/admin/ui/NumInput/NumInput";
import { PillSelect } from "@/components/admin/ui/PillSelect/PillSelect";
import { SearchField } from "@/components/admin/ui/SearchField/SearchField";
import { count, fmtP, num, PICTURES } from "@/features/admin/format";
import { checkFile, uploadImage } from "@/features/admin/images";
import { useLayout } from "@/features/admin/layout";
import { FRAME_NAMES, FRAME_SHORT, MAX_ITEMS, isCustom, lineTotal, pieces, separateFrame, type Product, type Req } from "@/features/admin/model";
import { CUSTOM_TITLE, customItem, fromFileName, fromProduct, lineId, priceList, resize, type PriceList } from "@/features/admin/order";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { plural } from "@/lib/format";
import type { RequestItem } from "@/lib/request";
import s from "./OrderEditor.module.scss";

const b = bem(s, "order-editor");

/** Files uploaded at once. */
const PARALLEL = 3;
const POSITIONS = ["позиция", "позиции", "позиций"] as const;

type Filter = "all" | "catalog" | "custom" | "price" | "image";
const FILTERS: readonly { k: Filter; n: string; test: (i: RequestItem) => boolean }[] = [
  { k: "all", n: "Все", test: () => true },
  { k: "catalog", n: "Из каталога", test: (i) => !isCustom(i) },
  { k: "custom", n: "Свои принты", test: isCustom },
  { k: "price", n: "Без цены", test: (i) => lineTotal(i) == null || (separateFrame(i) && i.framePrice == null) },
  { k: "image", n: "Без картинки", test: (i) => !i.image },
];

type Patch = Partial<RequestItem>;

/** The event comes from an open drawer over the screen (the photo editor, the request card). */
const inDialog = (target: EventTarget | null) => target instanceof Element && !!target.closest('[role="dialog"]');

const isLink = (v: string | undefined) => !!v && /^https?:\/\/\S+$/i.test(v.trim());

/**
 * A request's items on the whole screen, for large orders: a table with filters and search, bulk changes of the
 * selected lines, lines from the catalogue and custom prints, a pack of files (one line per picture), the progress
 * (lines marked made), the total and the total agreed with the client. Saves as you type, like the request card.
 */
export function OrderEditor({ r }: { r: Req }) {
  const { mode, tier } = useLayout();
  const { products, updateReq, toast } = useAdmin();
  const prices = useMemo(() => priceList(products), [products]);
  const byCode = useMemo(() => new Map(products.map((p) => [p.code, p])), [products]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [picking, setPicking] = useState(false);
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);
  const [over, setOver] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkQty, setBulkQty] = useState<number | null>(null);
  const id = r.id;

  const setItems = useCallback(
    (fn: (items: RequestItem[]) => RequestItem[]) => updateReq(id, (x) => ({ items: fn(x.items) })),
    [id, updateReq],
  );
  const patch = useCallback((i: number, p: Patch) => setItems((items) => items.map((it, j) => (j === i ? { ...it, ...p } : it))), [setItems]);
  const patchLine = useCallback((lid: string, p: Patch) => setItems((items) => items.map((it) => (it.id === lid ? { ...it, ...p } : it))), [setItems]);
  const toggle = useCallback((i: number) => setSelected((sel) => new Set(sel.has(i) ? [...sel].filter((x) => x !== i) : [...sel, i])), []);

  /** Lines go to the end of the list (up to MAX_ITEMS); filters are reset so they are in sight. */
  const append = useCallback(
    (added: RequestItem[], focus?: boolean) => {
      if (!added.length) return;
      let at = 0;
      let cut = 0;
      setItems((items) => {
        at = items.length;
        const fit = added.slice(0, Math.max(0, MAX_ITEMS - items.length));
        cut = added.length - fit.length;
        return [...items, ...fit];
      });
      if (cut) toast(`В заявке не больше ${num(MAX_ITEMS)} позиций — не добавлено: ${cut}`);
      setFilter("all");
      setQuery("");
      // A custom print added by hand: its title takes the focus once the row is there.
      if (focus) requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-row="${at}"] input[aria-label="Название"]`)?.focus());
    },
    [setItems, toast],
  );

  /** Removes lines with «Вернуть» (the list as it was: edits made since are dropped with it). */
  const remove = useCallback(
    (idx: readonly number[]) => {
      const gone = new Set(idx);
      let prev: RequestItem[] = [];
      setItems((items) => {
        prev = items;
        return items.filter((_, j) => !gone.has(j));
      });
      setSelected(new Set());
      toast(gone.size > 1 ? `Удалено: ${gone.size} ${plural(gone.size, ...POSITIONS)}` : "Позиция удалена", () => setItems(() => prev));
    },
    [setItems, toast],
  );

  /** A copy goes right after each line. */
  const duplicate = useCallback(
    (idx: readonly number[]) => {
      const copy = new Set(idx);
      // The copy is a line of its own: it does not share the original's id and is not made yet.
      setItems((items) => items.flatMap((it, j) => (copy.has(j) ? [it, { ...it, id: undefined, done: undefined }] : [it])));
      setSelected(new Set());
    },
    [setItems],
  );

  const removeOne = useCallback((i: number) => remove([i]), [remove]);
  const duplicateOne = useCallback((i: number) => duplicate([i]), [duplicate]);

  /** A pack of pictures: one custom print per file, title and size from the file name, in the order picked. */
  const uploadFiles = async (files: File[]) => {
    if (upload) return;
    const ok = files.filter((f) => !checkFile(f));
    if (ok.length < files.length) toast(`Пропущено файлов: ${files.length - ok.length} — нужны JPG, PNG или WebP до 40 МБ`);
    const room = MAX_ITEMS - r.items.length;
    if (ok.length > room) {
      toast(`В заявке не больше ${num(MAX_ITEMS)} позиций — загружу ${Math.max(0, room)} из ${ok.length}`);
      ok.splice(Math.max(0, room));
    }
    if (!ok.length) return;
    setUpload({ done: 0, total: ok.length });
    const results: (RequestItem | null | undefined)[] = Array.from({ length: ok.length });
    let next = 0;
    let ready = 0;
    let failed = 0;
    // Finished files join the list in their order: each waits for the ones before it.
    const flush = () => {
      const lines: RequestItem[] = [];
      while (ready < ok.length && results[ready] !== undefined) {
        const it = results[ready++];
        if (it) lines.push(it);
      }
      append(lines);
    };
    const worker = async () => {
      while (next < ok.length) {
        const k = next++;
        try {
          const image = await uploadImage(ok[k]);
          results[k] = customItem(prices, { ...fromFileName(ok[k].name), image });
        } catch {
          results[k] = null;
          failed++;
        }
        setUpload((u) => u && { ...u, done: u.done + 1 });
        flush();
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    setUpload(null);
    toast(failed ? `Загружено ${ok.length - failed} из ${ok.length} — остальные не удалось, попробуйте ещё раз` : `Добавлено: ${ok.length} ${plural(ok.length, ...POSITIONS)}`);
  };
  const onPasteFiles = useEffectEvent((files: File[]) => void uploadFiles(files));

  // Ctrl+V of copied pictures (not into a field, no drawer open): they go up as custom prints.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea") || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      onPasteFiles(files);
    };
    addEventListener("paste", onPaste);
    return () => removeEventListener("paste", onPaste);
  }, []);

  // Leaving the page while pictures go up: the browser asks.
  useEffect(() => {
    if (!upload) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", onLeave);
    return () => removeEventListener("beforeunload", onLeave);
  }, [upload]);

  const q = query.trim().toLowerCase();
  const test = FILTERS.find((f) => f.k === filter)!.test;
  const rows = r.items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => !q || `${it.title} ${it.code} ${it.note ?? ""} ${it.w ?? ""}x${it.h ?? ""}`.toLowerCase().includes(q))
    .filter(({ it }) => test(it));
  const chips = FILTERS.map((f) => ({ ...f, count: r.items.filter(f.test).length })).filter((f) => f.k === "all" || f.k === filter || f.count);
  const sel = [...selected].filter((i) => i < r.items.length);
  const allSel = rows.length > 0 && rows.every((x) => selected.has(x.i));
  const bulk = (p: Patch | ((it: RequestItem) => Patch)) => {
    const on = new Set(sel);
    setItems((items) => items.map((it, j) => (on.has(j) ? { ...it, ...(typeof p === "function" ? p(it) : p) } : it)));
  };
  const custom = r.items.filter(isCustom).length;
  const missing = r.items.filter(FILTERS[3].test).length;
  // Progress in pieces: a line marked made counts with its quantity.
  const total = pieces(r.items);
  const made = pieces(r.items.filter((i) => i.done));
  const pct = total ? Math.round((made / total) * 100) : 0;

  return (
    <div
      className={b(null, { over })}
      onDragOver={(e: DragEvent) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        if (!over && !inDialog(e.target)) setOver(true);
      }}
      onDragLeave={(e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e: DragEvent) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setOver(false);
        // A file dropped on the photo editor or the request card (they render inside this screen) is not a new line.
        if (!inDialog(e.target)) void uploadFiles([...e.dataTransfer.files]);
      }}
    >
      <div className={b("summary")}>
        <div className={b("stats")}>
          <Stat label="Позиций" value={num(r.items.length)} />
          <Stat label="Картин" value={num(pieces(r.items))} />
          <Stat label="Свои принты" value={num(custom)} />
          <Stat label="Без цены" value={num(missing)} alert={missing > 0} />
        </div>
        <OrderTotal r={r} className={b("total")} />
      </div>
      <div className={b("progress")}>
        <div className={b("progress-head")}>
          <span className={b("progress-label")}>Готово</span>
          <span className={b("progress-value")}>{`${num(made)} из ${count(total, PICTURES)} · ${pct}%`}</span>
        </div>
        <div className={b("progress-track")} role="progressbar" aria-label="Готово картин" aria-valuemin={0} aria-valuemax={total} aria-valuenow={made}>
          <div className={b("progress-fill", { full: total > 0 && made === total })} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={b("adds")}>
        <button type="button" className={b("add", { on: picking })} onClick={() => setPicking((v) => !v)}>
          + Из каталога
        </button>
        <button type="button" className={b("add")} onClick={() => append([customItem(prices)], true)}>
          + Свой принт
        </button>
        <label className={b("add", { busy: !!upload })}>
          {upload ? `Загрузка ${upload.done} из ${upload.total}…` : "Загрузить картинки"}
          <input
            className={b("file")}
            type="file"
            accept="image/*"
            multiple
            disabled={!!upload}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              void uploadFiles([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </label>
        <span className={b("hint")}>или перетащите картинки на страницу: каждая станет позицией, название и размер возьмутся из имени файла</span>
      </div>

      {picking && <CatalogPicker limit={8} onPick={(p) => append([fromProduct(p)])} />}

      <div className={b("toolbar")}>
        <div className={b("chips", { scroll: tier === 0 })}>
          {chips.map((c) => (
            <Chip key={c.k} label={c.n} count={c.count} active={filter === c.k} onClick={() => setFilter(c.k)} />
          ))}
        </div>
        <div className={b("search")}>
          <SearchField value={query} onChange={setQuery} placeholder="Название, код, размер, заметка" />
        </div>
      </div>

      <div className={b("table", { tier: tier === 2 ? "wide" : "narrow", phone: tier === 0 })}>
        {tier === 2 && (
          <div className={b("thead")}>
            <Check on={allSel} label="Выбрать все" onClick={() => setSelected(allSel ? new Set() : new Set(rows.map((x) => x.i)))} />
            <span />
            <span>Картина</span>
            <span>Размер</span>
            <span>Оформление</span>
            <span>Кол-во</span>
            <span>Цена за шт.</span>
            <span className={b("right")}>Сумма</span>
            <span />
          </div>
        )}
        {rows.map(({ it, i }) => (
          <Row
            key={i}
            it={it}
            i={i}
            product={byCode.get(it.code)}
            prices={prices}
            selected={selected.has(i)}
            patch={patch}
            patchLine={patchLine}
            toggle={toggle}
            remove={removeOne}
            duplicate={duplicateOne}
          />
        ))}
        {!rows.length && <p className={b("empty")}>{r.items.length ? "Ничего не найдено." : "Состав пока пуст — добавьте картины из каталога, свои принты или загрузите картинки."}</p>}
      </div>
      {sel.length > 0 && (
        <div className={b("bulk", { bar: mode === "bar" })}>
          <span className={b("bulk-count")}>{`Выбрано: ${sel.length}`}</span>
          <div className={b("bulk-actions")}>
            <PillSelect
              tone="ink"
              size="sm"
              aria-label="Оформление выбранных"
              placeholder="Оформление"
              options={FRAME_OPTIONS}
              value=""
              onChange={(frame) => bulk({ frame, ...(frame === FRAME_NAMES[0] && { framePrice: null }) })}
            />
            <span className={b("bulk-field")}>
              <NumInput className={b("bulk-input")} value={bulkPrice} onChange={setBulkPrice} placeholder="цена за шт." aria-label="Цена за штуку для выбранных" />
              <button type="button" className={b("bulk-button")} disabled={bulkPrice == null} onClick={() => bulk({ price: bulkPrice })}>
                Задать
              </button>
            </span>
            <span className={b("bulk-field")}>
              <NumInput className={b("bulk-input", { qty: true })} value={bulkQty} onChange={setBulkQty} min={1} digits={4} placeholder="кол-во" aria-label="Количество для выбранных" />
              <button type="button" className={b("bulk-button")} disabled={bulkQty == null} onClick={() => bulk({ qty: bulkQty! })}>
                Задать
              </button>
            </span>
            <button type="button" className={b("bulk-button")} onClick={() => bulk({ done: true })}>
              Готово
            </button>
            <button type="button" className={b("bulk-button")} onClick={() => bulk({ done: undefined })}>
              Не готово
            </button>
            <button type="button" className={b("bulk-button")} onClick={() => duplicate(sel)}>
              Дублировать
            </button>
            <button type="button" className={b("bulk-delete")} onClick={() => remove(sel)}>
              Удалить
            </button>
            <button type="button" className={b("bulk-clear")} aria-label="Снять выделение" onClick={() => setSelected(new Set())}>
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={b("foot")}>
        <span className={b("shown")}>
          {`${rows.length} из ${r.items.length} ${plural(r.items.length, ...POSITIONS)} · ${count(pieces(rows.map((x) => x.it)), PICTURES)}`}
        </span>
      </div>
      {over && <div className={b("drop")}>Отпустите — каждая картинка станет позицией</div>}
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={b("stat")}>
      <span className={b("stat-label")}>{label}</span>
      <span className={b("stat-value", { alert })}>{value}</span>
    </div>
  );
}

type RowProps = {
  it: RequestItem;
  i: number;
  product: Product | undefined;
  prices: PriceList;
  selected: boolean;
  patch: (i: number, p: Patch) => void;
  /** A change of the line by its id (a picture finishing its upload after the list changed). */
  patchLine: (id: string, p: Patch) => void;
  toggle: (i: number) => void;
  remove: (i: number) => void;
  duplicate: (i: number) => void;
};

const FRAME_OPTIONS = FRAME_NAMES.map((f) => ({ v: f, l: FRAME_SHORT[f] ?? f }));

/** Square check box of a line or of the whole list. */
function Check({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={b("check", { on })} aria-label={label} aria-pressed={on} onClick={onClick}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </button>
  );
}

/** One line of the table; re-renders only when its own line changes. */
const Row = memo(function Row({ it, i, product, prices, selected, patch, patchLine, toggle, remove, duplicate }: RowProps) {
  // Details (note, link to the original) are open while there is something in them, unless closed by hand.
  const [more, setMore] = useState<boolean | null>(null);
  const own = isCustom(it);
  const set = (p: Patch) => patch(i, p);
  // A picture opening in the editor: the line gets an id, the uploaded picture goes to the line with it.
  const claim = () => {
    const lid = it.id ?? lineId();
    if (!it.id) set({ id: lid });
    return (image: string) => patchLine(lid, { image });
  };
  const v = it.w ? `${it.w}x${it.h}` : "";
  const opts = (product?.sizes ?? []).map((z) => ({ v: `${z.w}x${z.h}`, l: `${z.w} × ${z.h} см` }));
  if (!opts.some((o) => o.v === v)) opts.unshift({ v, l: v ? `${it.w} × ${it.h} см` : "по запросу" });
  const details = more ?? (!!it.note || !!it.original);
  const line = lineTotal(it);

  return (
    <div className={b("row", { selected })} data-row={i}>
      <Check on={selected} label="Выбрать" onClick={() => toggle(i)} />
      <ItemThumb image={it.image} sizes="48px" className={b("thumb")} onUpload={own ? claim : undefined} caption={it.title || CUSTOM_TITLE} />
      <div className={b("name")}>
        {own ? (
          <input className={b("title-input")} value={it.title} onChange={(e) => set({ title: e.target.value.slice(0, 200) })} placeholder={CUSTOM_TITLE} aria-label="Название" />
        ) : (
          <span className={b("title")}>{it.title}</span>
        )}
        <span className={b("sub")}>
          {own ? CUSTOM_TITLE : it.code}
          {isLink(it.original) && (
            <a className={b("original")} href={it.original!.trim()} target="_blank" rel="noreferrer">
              оригинал ↗
            </a>
          )}
        </span>
      </div>
      <div className={b("controls")}>
        {own ? (
          <span className={b("field", { size: true, empty: !it.w || !it.h })}>
            <NumInput className={b("input", { size: true })} value={it.w} onChange={(w) => set(resize(prices, it, w, it.h))} digits={4} placeholder="Ш" aria-label="Ширина, см" />
            <span className={b("unit")}>×</span>
            <NumInput className={b("input", { size: true })} value={it.h} onChange={(h) => set(resize(prices, it, it.w, h))} digits={4} placeholder="В" aria-label="Высота, см" />
            <span className={b("unit")}>см</span>
          </span>
        ) : (
          <PillSelect
            size="sm"
            block
            className={b("size-select")}
            aria-label="Размер"
            options={opts}
            value={v}
            onChange={(val) => {
              const z = product?.sizes.find((z) => `${z.w}x${z.h}` === val);
              if (z) set({ w: z.w, h: z.h, price: z.price });
            }}
          />
        )}
        <span className={b("frame")}>
          <PillSelect
            size="sm"
            block
            aria-label="Оформление"
            options={FRAME_OPTIONS}
            value={FRAME_NAMES.includes(it.frame) ? it.frame : FRAME_NAMES[0]}
            onChange={(frame) => set({ frame, ...(frame === FRAME_NAMES[0] && { framePrice: null }) })}
          />
          {separateFrame(it) && (
            <span className={b("field", { frame: true, empty: it.framePrice == null })} title="Багет или рамка со стеклом за штуку — считаются отдельно">
              <span className={b("unit")}>+</span>
              <NumInput className={b("input")} value={it.framePrice ?? null} onChange={(framePrice) => set({ framePrice })} placeholder="рамка" aria-label="Цена оформления за штуку" />
            </span>
          )}
        </span>
        <span className={b("field", { qty: true })}>
          <NumInput className={b("input")} value={it.qty || 1} onChange={(qty) => set({ qty: qty! })} min={1} digits={4} aria-label="Количество" />
          <span className={b("unit")}>шт.</span>
        </span>
        <span className={b("field", { price: true, empty: it.price == null })}>
          <NumInput className={b("input")} value={it.price} onChange={(price) => set({ price })} placeholder="цена" aria-label="Цена за штуку" />
          <span className={b("unit")}>сум</span>
        </span>
        <span className={b("sum", { none: line == null })}>{line == null ? "по запросу" : fmtP(line)}</span>
      </div>
      <div className={b("tools")}>
        <button type="button" className={b("done", { on: !!it.done })} aria-label="Готово" aria-pressed={!!it.done} title={it.done ? "Готово — снять отметку" : "Отметить готовой"} onClick={() => set({ done: it.done ? undefined : true })}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
        <button type="button" className={b("tool", { on: details })} aria-label="Заметка и ссылка на оригинал" title="Заметка и ссылка на оригинал" aria-expanded={details} onClick={() => setMore(!details)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
        <button type="button" className={b("tool", { remove: true })} aria-label="Убрать" title="Убрать" onClick={() => remove(i)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {details && (
        <div className={b("details")}>
          <input className={b("detail-input")} value={it.note ?? ""} onChange={(e) => set({ note: e.target.value.slice(0, 500) })} placeholder="Заметка: что поправить, для кого, куда повесить" aria-label="Заметка к позиции" />
          <input className={b("detail-input")} value={it.original ?? ""} onChange={(e) => set({ original: e.target.value.slice(0, 1000) })} placeholder="Ссылка на оригинал для печати" aria-label="Ссылка на оригинал" inputMode="url" />
          <button type="button" className={b("detail-button")} onClick={() => duplicate(i)}>
            Дублировать
          </button>
        </div>
      )}
    </div>
  );
});
