"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ChangeEvent } from "react";
import { removeSiteOg } from "@/app/admin/actions";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/content/site";
import { checkFile, SITE_OG, uploadSiteOg } from "@/features/admin/images";
import { useLayout } from "@/features/admin/layout";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { IMAGE_BASE, SITE_OG_KEY } from "@/lib/images";
import s from "./OgEditor.module.scss";

const b = bem(s, "og-editor");

// The editor and its crop library load only when a picture is opened in it.
const PhotoEditor = dynamic(() => import("@/components/admin/PhotoEditor/PhotoEditor").then((m) => m.PhotoEditor), { ssr: false });

const FRAME = ["1,91 : 1", SITE_OG.w / SITE_OG.h] as const;

/**
 * «Превью»: the picture shown when someone shares a link to the site (home, collection, «Покупателям»; a work
 * has its own, made from its photo). The admin's own picture (framed in the photo editor, sent as a light JPEG)
 * or the generated card (app/opengraph-image.tsx), and how the link looks in Telegram.
 */
export function OgEditor() {
  const { toast } = useAdmin();
  const { mw } = useLayout();
  // Changes on every upload or removal, so the preview is fetched anew.
  const [version, setVersion] = useState(() => Date.now());
  const [custom, setCustom] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<{ source: File; n: number; open: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${IMAGE_BASE}${SITE_OG_KEY}?v=${version}`, { method: "HEAD", cache: "no-store" }).then(
      (r) => alive && setCustom(r.ok),
      () => alive && setCustom(false),
    );
    return () => {
      alive = false;
    };
  }, [version]);

  const src = custom === null ? null : custom ? `${IMAGE_BASE}${SITE_OG_KEY}?v=${version}` : `/opengraph-image?v=${version}`;

  const pick = (file?: File) => {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) return toast(problem);
    setPhoto((p) => ({ source: file, n: (p?.n ?? 0) + 1, open: true }));
  };
  const closePhoto = () => setPhoto((p) => p && { ...p, open: false });

  const upload = async (file: File) => {
    try {
      await uploadSiteOg(file);
      closePhoto();
      setCustom(null);
      setVersion(Date.now());
      toast("Картинка ссылки обновлена");
    } catch {
      toast("Не удалось загрузить картинку — проверьте соединение и попробуйте ещё раз");
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await removeSiteOg();
      setCustom(null);
      setVersion(Date.now());
      toast("Вернули стандартную карточку");
    } catch {
      toast("Не удалось — проверьте соединение");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={b(null, { narrow: mw < 900 })}>
      <section className={b("card")}>
        <div className={b("head")}>
          <h2 className={b("title")}>Общая карточка</h2>
          <span className={b("meta")}>{custom === null ? "" : custom ? "Своя картинка" : "Стандартная"}</span>
        </div>
        <p className={b("hint")}>
          Её показывают Telegram, WhatsApp и Instagram, когда кто-то делится ссылкой на главную, коллекцию или «Покупателям». У каждой картины карточка своя — она собирается из
          фото сама.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- the card as messengers get it, not a site image */}
        <div className={b("frame")}>{src && <img className={b("image")} src={src} alt="Картинка ссылки на сайт" />}</div>
        <div className={b("actions")}>
          <label className={b("upload")}>
            <input
              className={b("file")}
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                pick(ev.target.files?.[0]);
                ev.target.value = ""; // the same file can be picked again
              }}
            />
            {custom ? "Заменить картинку" : "Загрузить свою"}
          </label>
          {custom && (
            <DsButton variant="ghost" onClick={reset} disabled={busy}>
              Вернуть стандартную
            </DsButton>
          )}
        </div>
        <p className={b("note")}>
          Размер — {SITE_OG.w}×{SITE_OG.h}: после выбора кадрируете картинку, она сожмётся в JPEG до {SITE_OG.maxBytes / 1024} КБ. Telegram помнит превью уже отправленных
          ссылок: чтобы обновить их сразу, отправьте ссылку боту @WebpageBot.
        </p>
      </section>

      <section className={b("card", { telegram: true })}>
        <h2 className={b("title")}>Так ссылка выглядит в Telegram</h2>
        <div className={b("chat")}>
          <div className={b("bubble")}>
            <span className={b("link")}>kuznets.uz</span>
            <div className={b("preview")}>
              <span className={b("site")}>Kuznetsovs Gallery</span>
              <span className={b("preview-title")}>{SITE_TITLE}</span>
              <span className={b("preview-text")}>{SITE_DESCRIPTION}</span>
              {/* eslint-disable-next-line @next/next/no-img-element -- the card as messengers get it, not a site image */}
              <div className={b("preview-frame")}>{src && <img className={b("image")} src={src} alt="" />}</div>
            </div>
            <span className={b("time")}>14:32</span>
          </div>
        </div>
      </section>

      {photo && <PhotoEditor key={photo.n} open={photo.open} source={photo.source} caption="Картинка ссылки" frame={FRAME} onCancel={closePhoto} onDone={upload} />}
    </div>
  );
}
