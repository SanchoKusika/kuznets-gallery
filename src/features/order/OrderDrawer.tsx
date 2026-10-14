"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Media } from "@/components/ui/Media/Media";
import { CONTACTS } from "@/content/site";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { bem } from "@/lib/bem";
import { formatPrice } from "@/lib/format";
import { isPhoneValid, type RequestPayload } from "@/lib/request";
import { order, useOrder } from "./store";
import s from "./OrderDrawer.module.scss";

const b = bem(s, "order-drawer");

const EASE_OUT = "cubic-bezier(.2,.7,.2,1)";
const EASE_IN_OUT = "cubic-bezier(.6,0,.3,1)";

/**
 * Request drawer (prototype "Заявка"): order lines, total, contact form.
 * Slides in over a scrim in 600ms and back out in 450ms.
 */
export function OrderDrawer() {
  const { items, drawerOpen } = useOrder();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  // Mount on open; closing is handled below after the exit animation.
  if (drawerOpen && !mounted) setMounted(true);

  // Open: the panel slides in over a fading scrim (prototype `[data-slide]` / `[data-fade]`).
  useLayoutEffect(() => {
    if (!mounted || !drawerOpen || !prefersMotion()) return;
    const slide = panelRef.current?.animate([{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 600, easing: EASE_OUT });
    const fade = scrimRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    return () => {
      slide?.cancel();
      fade?.cancel();
    };
  }, [mounted, drawerOpen]);

  // Focus moves into the panel while it is open and back to whatever opened it.
  useEffect(() => {
    if (!drawerOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus({ preventScroll: true });
    return () => opener?.focus({ preventScroll: true });
  }, [drawerOpen]);

  // The form (and its focused button) gives way to "Спасибо": keep focus inside the panel.
  useEffect(() => {
    if (sent) panelRef.current?.focus({ preventScroll: true });
  }, [sent]);

  // Close: reverse both layers, then unmount and reset (a sent request clears the comment).
  // Reopening mid-way cancels the exit.
  useEffect(() => {
    if (drawerOpen || !mounted) return;
    const finish = () => {
      setMounted(false);
      setError(false);
      setFailed(false);
      if (sent) {
        setSent(false);
        setComment("");
      }
    };
    if (!prefersMotion()) {
      finish();
      return;
    }
    const opts = { duration: 450, easing: EASE_IN_OUT, fill: "forwards" as const };
    const anims = [
      panelRef.current?.animate([{ transform: "none" }, { transform: "translateX(100%)" }], opts),
      scrimRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], opts),
    ].filter((a): a is Animation => !!a);
    let cancelled = false;
    Promise.all(anims.map((a) => a.finished)).then(() => cancelled || finish(), () => {});
    return () => {
      cancelled = true;
      anims.forEach((a) => a.cancel());
    };
  }, [drawerOpen, mounted, sent]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") order.close();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  if (!mounted) return null;

  const nameOk = !!name.trim();
  const phoneOk = isPhoneValid(phone);
  const showError = error && !(nameOk && phoneOk);
  const errorText = !nameOk && !phoneOk ? "Укажите имя и телефон" : !nameOk ? "Укажите имя" : "Проверьте номер телефона";

  const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const note =
    (items.some((i) => i.frameIndex > 0) ? "Доставка и оформление рассчитываются отдельно" : "Доставка оплачивается отдельно") +
    (items.some((i) => i.price == null) ? " · часть позиций — цена по запросу" : "");

  const submit = async () => {
    if (!nameOk || !phoneOk) {
      setError(true);
      return;
    }
    const payload: RequestPayload = {
      name: name.trim(),
      phone: phone.trim(),
      comment: comment.trim(),
      items: items.map((i) => ({ code: i.code, title: i.title, image: i.img, w: i.w, h: i.h, price: i.price, frame: i.frame, qty: 1 })),
    };
    setSending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(String(res.status));
      order.clear();
      setError(false);
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div ref={scrimRef} className={b("scrim")} onClick={order.close} />
      <aside ref={panelRef} className={b()} role="dialog" aria-modal="true" aria-label="Заявка" tabIndex={-1} data-lenis-prevent>
        <div className={b("head")}>
          <span className={b("title")}>Заявка</span>
          <button type="button" className={b("close")} onClick={order.close}>
            Закрыть ✕
          </button>
        </div>

        {sent ? (
          <div className={b("thanks")}>
            <span className={b("thanks-title")}>Спасибо, {name.trim()}!</span>
            <span className={b("thanks-text")}>
              Мы перезвоним по номеру {phone.trim()}, уточним детали и подготовим макет. Изготовление — от 3 до 7 дней после утверждения.
            </span>
          </div>
        ) : (
          <>
            <div className={b("lines")}>
              {items.map((i) => (
                <div key={i.key} className={b("line")}>
                  <Media src={i.src} sizes="72px" className={b("thumb")} />
                  <div className={b("line-text")}>
                    <span className={b("line-title")}>{i.title}</span>
                    <span className={b("line-meta")}>
                      {i.size} · {i.frame}
                    </span>
                    <span className={b("line-price")}>{formatPrice(i.price)}</span>
                  </div>
                  <button type="button" className={b("remove")} title="Убрать" aria-label="Убрать" onClick={() => order.remove(i.key)}>
                    <Icon name="trash" />
                  </button>
                </div>
              ))}
              {items.length === 0 ? (
                <p className={b("empty")}>Заявка пуста. Выберите работу в коллекции или опишите свою идею — дизайнер подготовит макет.</p>
              ) : (
                <div className={b("summary")}>
                  <div className={b("total")}>
                    <span>Итого</span>
                    <span className={b("total-value")}>{total ? formatPrice(total) : "по запросу"}</span>
                  </div>
                  <span className={b("note")}>{note}</span>
                </div>
              )}
            </div>

            <div className={b("form")}>
              <input
                className={b("field", { invalid: error && !nameOk })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                autoComplete="name"
                aria-label="Ваше имя"
              />
              <input
                className={b("field", { invalid: error && !phoneOk })}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 __ ___ __ __"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-label="Телефон"
              />
              <textarea
                className={b("field", { area: true })}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий: идея, размер, интерьер"
                rows={3}
                aria-label="Комментарий"
              />
              {(showError || failed) && (
                <span className={b("error")} role="alert">
                  <span className={b("error-dot")} />
                  {showError ? errorText : `Не удалось отправить. Позвоните нам: ${CONTACTS.phones[0].label}`}
                </span>
              )}
              <Button size="lg" block icon="arrow-right" iconEnd className={b("submit")} onClick={submit} disabled={sending}>
                Отправить заявку
              </Button>
              <span className={b("call")}>или позвоните: {CONTACTS.phones.map((p) => p.label).join(" · ")}</span>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
