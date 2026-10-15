"use client";

import type { ReactNode } from "react";
import { bem } from "@/lib/bem";
import s from "./Drawer.module.scss";

const b = bem(s, "admin-drawer");

type Props = {
  open: boolean;
  onClose: () => void;
  /** Caption at the top, e.g. "Заявка № 1048 · 12 окт, 14:05". */
  head: string;
  footer: ReactNode;
  /** The product card lets its footer wrap on narrow screens; the request card does not. */
  footerWrap?: boolean;
  /** Another drawer lies over this one (the photo editor over the product card): it stays, but takes no focus. */
  covered?: boolean;
  children: ReactNode;
};

/**
 * Side panel min(620px, 100vw) over a scrim (prototype admin drawer): slides in and out in .45s.
 * It stays mounted while closed, so the last card slides out with its content; one mounted open slides in too.
 */
export function Drawer({ open, onClose, head, footer, footerWrap, covered, children }: Props) {
  const active = open && !covered;
  return (
    <>
      <div className={b("scrim", { open })} onClick={onClose} />
      <aside className={b(null, { open })} role="dialog" aria-modal={active} aria-label={head} aria-hidden={!active} inert={!active}>
        <div className={b("head")}>
          <span className={b("caption")}>{head}</span>
          <button type="button" className={b("close")} aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={b("body")}>{children}</div>
        <div className={b("footer", { wrap: footerWrap })}>{footer}</div>
      </aside>
    </>
  );
}

/** Section caption inside a drawer («Клиент», «Состав заказа · 2 картины»). */
export function DrawerLabel({ children, gap = 36, after = 14 }: { children: ReactNode; gap?: 36 | 40; after?: 12 | 14 }) {
  return <div className={b("label", { gap, after })}>{children}</div>;
}
