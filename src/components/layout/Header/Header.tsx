"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import { Logo } from "@/components/ui/Logo/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle/ThemeToggle";
import { PRIMARY_PHONE } from "@/content/site";
import { order, useOrder } from "@/features/order/store";
import { lockScroll, unlockScroll } from "@/features/scroll/scroll-lock";
import { scrollToContacts } from "@/features/scroll/smooth-scroll";
import { bem } from "@/lib/bem";
import { routes, sectionOf } from "@/lib/routes";
import { StaggeredMenu } from "../StaggeredMenu/StaggeredMenu";
import s from "./Header.module.scss";

const b = bem(s, "header");

type MenuState = { mounted: boolean; on: boolean; closing: boolean };
const MENU_CLOSED: MenuState = { mounted: false, on: false, closing: false };

export function Header({ total }: { total: number }) {
  const pathname = usePathname();
  const section = sectionOf(pathname);
  const count = useOrder().items.length;
  const scrolled = useScrolledPast(40);

  const [menu, setMenu] = useState<MenuState>(MENU_CLOSED);
  const menuRef = useRef(menu);
  useEffect(() => {
    menuRef.current = menu;
  }, [menu]);

  const openMenu = useCallback(() => {
    if (menuRef.current.mounted) return;
    lockScroll("menu");
    setMenu({ mounted: true, on: true, closing: false });
  }, []);

  const closeMenu = useCallback(() => {
    const m = menuRef.current;
    if (!m.mounted || m.closing) return;
    setMenu({ mounted: true, on: false, closing: true });
  }, []);

  // «Контакты» from the menu scrolls once the menu is gone: while it is open the page is scroll-
  // locked (`html[data-scroll-lock]`), and a target taken then came out 24px off.
  const contactsAfterClose = useRef(false);

  const onMenuClosed = useCallback(() => {
    unlockScroll("menu");
    setMenu(MENU_CLOSED);
    if (contactsAfterClose.current) {
      contactsAfterClose.current = false;
      scrollToContacts();
    }
  }, []);

  // Never leave the page locked if the header goes away with the menu open.
  useEffect(() => () => unlockScroll("menu"), []);

  // Esc closes; growing past the mobile breakpoint unmounts the menu at once.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    const wide = matchMedia("(width >= 960px)");
    const onWide = () => {
      if (wide.matches && menuRef.current.mounted) onMenuClosed();
    };
    addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [closeMenu, onMenuClosed]);

  const goContacts = (e: MouseEvent) => {
    e.preventDefault();
    if (!menuRef.current.mounted) {
      scrollToContacts();
      return;
    }
    contactsAfterClose.current = true;
    closeMenu();
  };

  // A page link clicked while the menu is still closing wins over a pending «Контакты».
  const navigateFromMenu = () => {
    contactsAfterClose.current = false;
    closeMenu();
  };

  const nav = [
    { key: "catalog", label: "Коллекция", href: routes.collection(), count: total, active: section === "catalog" },
    { key: "info", label: "Покупателям", href: routes.info, count: null, active: section === "info" },
  ];

  return (
    <>
      <header className={b(null, { scrolled })}>
        <div className={b("classic")}>
          <Link href={routes.home} className={b("logo")} aria-label="Kuznetsovs Gallery — на главную">
            <Logo className={b("logo-img")} live />
          </Link>
          <nav className={b("nav")} aria-label="Основная навигация">
            {nav.map((n) => (
              <Link key={n.key} href={n.href} className={b("nav-item", { active: n.active })}>
                {n.label}
                <span className={b("nav-count")}>{n.count ?? ""}</span>
              </Link>
            ))}
            <a href="#contacts" className={b("nav-item")} onClick={goContacts}>
              Контакты
              <span className={b("nav-count")} />
            </a>
          </nav>
          <div className={b("actions")}>
            <ThemeToggle />
            <a href={PRIMARY_PHONE.href} className={b("phone")}>
              <Icon name="phone" size={14} />
              {PRIMARY_PHONE.label}
            </a>
            <button type="button" className={b("cta")} onClick={order.open} data-order-target>
              <Icon name="bag" size={15} />
              Заявка <span className={b("count")}>{count}</span>
            </button>
          </div>
        </div>

        <div className={b("compact")}>
          <Link href={routes.home} className={b("logo")} aria-label="Kuznetsovs Gallery — на главную">
            <Logo className={b("logo-img", { compact: true })} live />
          </Link>
          <div className={b("compact-actions")}>
            <ThemeToggle />
            <button type="button" className={b("bag")} aria-label="Заявка" onClick={order.open} data-order-target>
              <Icon name="bag" size={15} />
              <span className={b("bag-label")}>Заявка</span>
              <span className={b("count")}>{count}</span>
            </button>
            <button
              type="button"
              className={b("menu-btn", { open: menu.on })}
              aria-label={menu.on ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menu.on}
              onClick={menu.on ? closeMenu : openMenu}
            >
              <span className={b("menu-label")}>
                <span className={b("menu-label-track")}>
                  <span className={b("menu-label-line")}>Меню</span>
                  <span className={b("menu-label-line")}>Закрыть</span>
                </span>
              </span>
              <span className={b("burger")}>
                <span className={b("burger-line", { top: true })} />
                <span className={b("burger-line", { bottom: true })} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {menu.mounted && (
        <StaggeredMenu
          section={section}
          closing={menu.closing}
          onClosed={onMenuClosed}
          onNavigate={navigateFromMenu}
          onContacts={goContacts}
        />
      )}
    </>
  );
}

function subscribeScroll(cb: () => void) {
  addEventListener("scroll", cb, { passive: true });
  return () => removeEventListener("scroll", cb);
}

function useScrolledPast(offset: number) {
  return useSyncExternalStore(
    subscribeScroll,
    () => scrollY > offset,
    () => false,
  );
}
