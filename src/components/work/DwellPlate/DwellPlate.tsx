"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { useOrder } from "@/features/order/store";
import { isScrollLocked } from "@/features/scroll/scroll-lock";
import { bem } from "@/lib/bem";
import s from "./DwellPlate.module.scss";

const b = bem(s, "dwell-plate");

const STORAGE_KEY = "kz_dwell_plate";
/** Seconds on the page (tab in view, nothing covering it) before the plate appears. */
const DWELL_S = 30;
/** The plate leaves by itself after this long, ms. */
const STAY_MS = 16_000;

const seen = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Museum plate that turns up once per visit when someone has looked at one work for half a minute:
 * a joke with a way to act on it. `onAdd` is the page's «Добавить в заявку» with the chosen size.
 * Stays out of the way while the request is open or the work is already in it.
 */
export function DwellPlate({ code, onAdd }: { code: string; onAdd: (e: MouseEvent<HTMLButtonElement>) => void }) {
  const [shown, setShown] = useState(false);
  const { items, drawerOpen } = useOrder();

  // Counts only the seconds the page is really in view: not in a hidden tab, not under the menu, the request or the meditation mode.
  useEffect(() => {
    if (seen()) return;
    let seconds = 0;
    const timer = setInterval(() => {
      if (document.hidden || isScrollLocked() || ++seconds < DWELL_S) return;
      clearInterval(timer);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setShown(true);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setShown(false), STAY_MS);
    return () => clearTimeout(timer);
  }, [shown]);

  if (!shown || drawerOpen || items.some((i) => i.code === code)) return null;

  return (
    <aside className={b()} aria-label="Подсказка куратора">
      <button type="button" className={b("close")} aria-label="Закрыть" onClick={() => setShown(false)}>
        <Icon name="close" size={14} />
      </button>
      <span className={b("label")}>{code} · Табличка куратора</span>
      <p className={b("text")}>Вы смотрите на неё уже полминуты. Это любовь?</p>
      <Button
        size="md"
        icon="plus"
        className={b("button")}
        onClick={(e) => {
          setShown(false);
          onAdd(e);
        }}
      >
        Добавить в заявку
      </Button>
    </aside>
  );
}
