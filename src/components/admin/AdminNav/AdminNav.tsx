"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle/ThemeToggle";
import { useLayout } from "@/features/admin/layout";
import { TABS, useAdmin, type Tab } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { routes } from "@/lib/routes";
import s from "./AdminNav.module.scss";

const b = bem(s, "admin-nav");

// Lucide icons of the prototype (layout-dashboard, inbox, image, tag, message-square-quote).
const ICONS: Record<Tab, ReactNode> = {
  dash: (
    <>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </>
  ),
  req: (
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  cat: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
    </>
  ),
  price: (
    <>
      <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
    </>
  ),
  rev: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 12a2 2 0 0 0 2-2V8H8" />
      <path d="M14 12a2 2 0 0 0 2-2V8h-2" />
    </>
  ),
};

/**
 * Admin navigation by width (prototype `mode`): sidebar 240px ≥1024, rail 88px ≥640,
 * otherwise a sticky top bar and a fixed bottom tab bar.
 */
export function AdminNav() {
  const { mode } = useLayout();
  const { admin, tab, setTab, requests, products, reviews } = useAdmin();
  const fresh = requests.filter((r) => r.status === "new").length;
  const initial = (admin.name.trim()[0] || "·").toUpperCase();
  const counts: Partial<Record<Tab, number | "">> = { req: fresh || "", cat: products.length, rev: reviews.length };

  if (mode === "side") {
    return (
      <aside className={b(null, { side: true })}>
        <Link href={routes.home} className={b("brand")}>
          <span className={b("word")}>
            kuznetsovs<span className={b("dot")}>.</span>
          </span>
          <span className={b("caption")}>Админ-панель</span>
        </Link>
        <nav className={b("list")}>
          {TABS.map(([k, name]) => (
            <button key={k} type="button" className={b("item", { active: tab === k })} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
              <span>{name}</span>
              <span className={b("count")}>
                {k === "req" && fresh > 0 && <span className={b("new-dot")} />}
                <span>{counts[k] ?? ""}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className={b("user")}>
          <span className={b("avatar")}>{initial}</span>
          <span className={b("name")}>{admin.name}</span>
          <button type="button" className={b("logout")} onClick={() => signOut()}>
            Выйти
          </button>
        </div>
        <div className={b("foot")}>
          <Link href={routes.home} className={b("back")}>
            ← На сайт
          </Link>
          <ThemeToggle />
        </div>
      </aside>
    );
  }

  const tabs = TABS.map(([k, name]) => (
    <button key={k} type="button" className={b("tab", { active: tab === k })} aria-label={name} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
      <span className={b("tab-icon")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {ICONS[k]}
        </svg>
      </span>
      <span className={b("tab-label")}>{name}</span>
      {k === "req" && fresh > 0 && <span className={b("badge")}>{fresh > 99 ? "99+" : fresh}</span>}
    </button>
  ));
  const account = <Account name={admin.name} initial={initial} below={mode === "bar"} />;

  if (mode === "rail") {
    return (
      <aside className={b(null, { rail: true })}>
        <Link href={routes.home} title="На сайт" className={b("mark")}>
          k<span className={b("dot")}>.</span>
        </Link>
        <nav className={b("rail-list")}>{tabs}</nav>
        <div className={b("rail-bottom")}>
          <ThemeToggle variant="icon" />
          {account}
        </div>
      </aside>
    );
  }

  return (
    <>
      <div className={b(null, { bar: true })}>
        <Link href={routes.home} className={b("bar-brand")}>
          <span className={b("bar-word")}>
            kuznetsovs<span className={b("dot")}>.</span>
          </span>
          <span className={b("bar-caption")}>Админ</span>
        </Link>
        <div className={b("bar-tools")}>
          {account}
          <ThemeToggle />
        </div>
      </div>
      <nav className={b("tabbar")}>{tabs}</nav>
    </>
  );
}

/** Avatar with a popover «На сайт / Выйти» (rail and top bar). */
function Account({ name, initial, below }: { name: string; initial: string; below: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={b("account")}>
      <button type="button" className={b("avatar", { button: true })} aria-label="Аккаунт" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {initial}
      </button>
      {open && (
        <>
          <div className={b("veil")} onClick={() => setOpen(false)} />
          <div className={b("menu", { below })}>
            <span className={b("menu-name")}>{name}</span>
            <Link href={routes.home} className={b("menu-item")}>
              На сайт
            </Link>
            <button type="button" className={b("menu-item")} onClick={() => signOut()}>
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  );
}
