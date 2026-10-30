"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, type ChangeEvent, type DragEvent } from "react";
import { createImageUpload } from "@/app/admin/actions";
import { Chip } from "@/components/admin/ui/Chip/Chip";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { Drawer, DrawerLabel } from "@/components/admin/ui/Drawer/Drawer";
import { Field } from "@/components/admin/ui/Field/Field";
import { Switch } from "@/components/admin/ui/Switch/Switch";
import { num } from "@/features/admin/format";
import { ADMIN_CATS, fromDraft, type ProductDraft } from "@/features/admin/model";
import { useAdmin, type ProductEdit } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { imageUrl, isForeign } from "@/lib/images";
import { routes } from "@/lib/routes";
import s from "./ProductDrawer.module.scss";

const b = bem(s, "product-card");

// The editor and its crop library load only when a photo is opened in it.
const PhotoEditor = dynamic(() => import("@/components/admin/PhotoEditor/PhotoEditor").then((m) => m.PhotoEditor), { ssr: false });

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/**
 * Product card in the drawer: image (path, link or an uploaded file), title, description, directions,
 * sizes with prices, sizes on request and visibility. Nothing is saved until «Сохранить».
 * A picked or dropped file, and the current photo on «Редактировать», open in the photo editor first.
 */
export function ProductDrawer({ open, edit }: { open: boolean; edit: ProductEdit | null }) {
  const { closeDrawer, confirmClose, discardDraft, saveProd, deleteProds, duplicateProd, setDraft, toast } = useAdmin();
  const [uploading, setUploading] = useState(false);
  // The photo in the editor; `n` mounts a fresh editor for every photo, the closed one stays to slide out.
  const [photo, setPhoto] = useState<{ source: File | string; n: number; open: boolean } | null>(null);

  if (!edit) return <Drawer open={false} onClose={closeDrawer} head="" footer={null}>{null}</Drawer>;
  const { draft: e, initial, isNew } = edit;
  const save = () => saveProd(fromDraft(e), isNew);
  const src = e.image ? imageUrl(e.image) : "";

  type SizeDraft = ProductDraft["sizes"][number];
  const setSize = (i: number, patch: Partial<SizeDraft>) => setDraft((x) => ({ sizes: x.sizes.map((z, j) => (j === i ? { ...z, ...patch } : z)) }));

  /** Uploads the editor's result straight to Storage through a signed URL and puts the new key into the path field. */
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { path, url } = await createImageUpload(file.name);
      const body = new FormData();
      body.append("cacheControl", "31536000");
      body.append("", file);
      const res = await fetch(url, { method: "PUT", body, headers: { "x-upsert": "false" } });
      if (!res.ok) throw new Error(String(res.status));
      setDraft({ image: path });
      closePhoto();
    } catch {
      toast("Не удалось загрузить изображение — JPG, PNG или WebP до 15 МБ");
    } finally {
      setUploading(false);
    }
  };

  const editPhoto = (source: File | string) => setPhoto((p) => ({ source, n: (p?.n ?? 0) + 1, open: true }));
  const closePhoto = () => setPhoto((p) => p && { ...p, open: false });
  const pick = (file: File | undefined) => file && editPhoto(file);

  return (
    <>
      <Drawer
        open={open}
        onClose={closeDrawer}
        head={`${e.code} · ${isNew ? "Новая картина" : "Редактирование"}`}
        covered={photo?.open}
        footerWrap
        footer={
          confirmClose ? (
            <>
              <div className={b("secondary")}>
                <span className={b("unsaved")}>Изменения не сохранены</span>
              </div>
              <div className={b("primary")}>
                <DsButton variant="ghost" onClick={discardDraft}>
                  Не сохранять
                </DsButton>
                <DsButton onClick={save}>Сохранить</DsButton>
              </div>
            </>
          ) : (
          <>
            <div className={b("secondary")}>
              {!isNew && (
                <>
                  <button type="button" className={b("delete")} onClick={() => deleteProds([e.code])}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M8 6V4h8v2" />
                    </svg>
                    Удалить
                  </button>
                  <button type="button" className={b("duplicate")} onClick={duplicateProd}>
                    Дублировать
                  </button>
                  {/* Hidden works have no page on the site. */}
                  {!initial.hidden && (
                    <a className={b("site-link")} href={routes.work(e.code.toLowerCase())} target="_blank" rel="noopener">
                      На сайте ↗
                    </a>
                  )}
                </>
              )}
            </div>
            <div className={b("primary")}>
              <DsButton variant="ghost" onClick={closeDrawer}>
                Отмена
              </DsButton>
              <DsButton onClick={save}>Сохранить</DsButton>
            </div>
          </>
          )
        }
      >
        <label
          className={b("preview", { busy: uploading })}
          title="Нажмите или перетащите файл, чтобы загрузить изображение"
          onDragOver={(ev: DragEvent) => ev.preventDefault()}
          onDrop={(ev: DragEvent) => {
            ev.preventDefault();
            pick(ev.dataTransfer.files[0]);
          }}
        >
          <input className={b("file")} type="file" accept="image/jpeg,image/png,image/webp" onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              pick(ev.target.files?.[0]);
              ev.target.value = ""; // the same file can be picked again
            }}
          />
          {src ? (
            <>
              <Image className={b("preview-img")} src={src} alt="" fill sizes="(max-width: 620px) 100vw, 620px" unoptimized={isForeign(src)} />
              {!isForeign(src) && (
                <button
                  type="button"
                  className={b("edit")}
                  onClick={(ev) => {
                    ev.preventDefault(); // the label around must not open the file picker
                    editPhoto(src);
                  }}
                >
                  Редактировать
                </button>
              )}
            </>
          ) : (
            <span className={b("no-image")}>{uploading ? "Загрузка…" : "Нет изображения"}</span>
          )}
        </label>
        <Field label="Изображение — путь в uploads или ссылка" className={b("field")}>
          <input className={b("input", { path: true })} value={e.image} onChange={(ev) => setDraft({ image: ev.target.value })} placeholder="2024/05/kartina.jpg" />
        </Field>
        <Field label="Ровное фото для «Примерьте размер» — путь или ссылка" className={b("field")}>
          <input className={b("input", { path: true })} value={e.flatImage} onChange={(ev) => setDraft({ flatImage: ev.target.value })} placeholder="flat/KZ-001.jpg" />
        </Field>

        <Field label="Название" className={b("field", { gap: 28 })}>
          <input className={b("input", { title: true })} value={e.title} onChange={(ev) => setDraft({ title: ev.target.value })} placeholder="Название картины" />
        </Field>
        <Field label="Описание" className={b("field", { gap: 20 })}>
          <textarea className={b("input", { desc: true })} value={e.description} onChange={(ev) => setDraft({ description: ev.target.value })} rows={3} placeholder="Пара фраз о картине" />
        </Field>

        <DrawerLabel>Направления</DrawerLabel>
        <div className={b("cats")}>
          {ADMIN_CATS.map((c) => (
            <Chip
              key={c.k}
              label={c.n}
              active={e.categories.includes(c.k)}
              onClick={() => setDraft((x) => ({ categories: x.categories.includes(c.k) ? x.categories.filter((y) => y !== c.k) : [...x.categories, c.k] }))}
            />
          ))}
        </div>

        <DrawerLabel after={12}>
          <span>Размеры и цены</span>
          <span>см · сум</span>
        </DrawerLabel>
        <div className={b("sizes")}>
          {e.sizes.map((z, i) => (
            <div key={i} className={b("size")}>
              <input className={b("size-input")} value={z.w} onChange={(ev) => setSize(i, { w: onlyDigits(ev.target.value) })} inputMode="numeric" placeholder="ш" aria-label="Ширина" />
              <span className={b("size-x")}>×</span>
              <input className={b("size-input")} value={z.h} onChange={(ev) => setSize(i, { h: onlyDigits(ev.target.value) })} inputMode="numeric" placeholder="в" aria-label="Высота" />
              <input
                className={b("size-input", { price: true })}
                value={z.price === "" ? "" : num(+z.price)}
                onChange={(ev) => setSize(i, { price: onlyDigits(ev.target.value) })}
                inputMode="numeric"
                placeholder="по запросу"
                aria-label="Цена"
              />
              <button type="button" className={b("size-remove")} aria-label="Удалить размер" onClick={() => setDraft((x) => ({ sizes: x.sizes.filter((_, j) => j !== i) }))}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={b("add-size")} onClick={() => setDraft((x) => ({ sizes: [...x.sizes, { w: "", h: "", price: "" }] }))}>
          + Размер
        </button>
        <Field label="Размеры по запросу — через запятую" className={b("field", { gap: 24 })}>
          <input className={b("input", { path: true })} value={e.customText} onChange={(ev) => setDraft({ customText: ev.target.value })} placeholder="100/140 см, 35/35 см" />
        </Field>

        <button type="button" className={b("visibility")} aria-pressed={!e.hidden} onClick={() => setDraft((x) => ({ hidden: !x.hidden }))}>
          <span>
            <span className={b("visibility-title")}>Показывать на сайте</span>
            <span className={b("visibility-text")}>Скрытая картина остаётся в админке</span>
          </span>
          <Switch on={!e.hidden} />
        </button>
      </Drawer>
      {photo && <PhotoEditor key={photo.n} open={photo.open} source={photo.source} caption={`${e.code} · Фото`} onCancel={closePhoto} onDone={upload} />}
    </>
  );
}
