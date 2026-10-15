"use client";

import { Activity, useEffect, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav/AdminNav";
import { Catalog } from "@/components/admin/Catalog/Catalog";
import { Dashboard } from "@/components/admin/Dashboard/Dashboard";
import { Prices } from "@/components/admin/Prices/Prices";
import { ProductDrawer } from "@/components/admin/ProductDrawer/ProductDrawer";
import { RequestDrawer } from "@/components/admin/RequestDrawer/RequestDrawer";
import { Requests } from "@/components/admin/Requests/Requests";
import { ReviewsEditor } from "@/components/admin/ReviewsEditor/ReviewsEditor";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { Segmented } from "@/components/admin/ui/Segmented/Segmented";
import { Toast } from "@/components/admin/ui/Toast/Toast";
import { cap, count, PICTURES, REQUESTS } from "@/features/admin/format";
import { GREETING_KEY } from "@/features/admin/greeting";
import { LayoutContext, useAdminLayout, useLayout } from "@/features/admin/layout";
import type { AdminData, AdminUser } from "@/features/admin/model";
import { AdminProvider, TABS, useAdmin, type ReqView, type Tab } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { plural } from "@/lib/format";
import s from "./AdminApp.module.scss";

const b = bem(s, "admin");

type Props = { admin: AdminUser; data: AdminData; edit?: string; tab?: string };

/**
 * The admin panel (design/Admin.dc.html): navigation, page header, five sections, drawers and the toast.
 * Rendered on the client only — it lays out by window width and shows local dates and "5 мин назад".
 */
export function AdminApp({ admin, data, edit, tab }: Props) {
  const layout = useAdminLayout();
  if (!layout) return null;
  return (
    <LayoutContext value={layout}>
      <AdminProvider admin={admin} initial={data}>
        <Shell edit={edit} tab={tab} />
      </AdminProvider>
    </LayoutContext>
  );
}

const TITLES: Record<Tab, string> = { dash: "обзор", req: "заявки", cat: "каталог", price: "прайс", rev: "отзывы" };
const VIEWS = [
  ["list", "Список"],
  ["board", "Доска"],
] as const satisfies readonly (readonly [ReqView, string])[];

function Shell({ edit, tab: tabParam }: { edit?: string; tab?: string }) {
  const { mode } = useLayout();
  const store = useAdmin();
  const { admin, tab, setTab, requests, products, reviews, drawer, toastState, toastOn, undo } = store;

  // Links from the site: /admin?edit=KZ-001 opens the card, ?tab=req a section; then the URL is cleaned.
  useEffect(() => {
    if (edit) {
      setTab("cat");
      store.openProd(edit.toUpperCase());
    } else if (TABS.some(([k]) => k === tabParam)) setTab(tabParam as Tab);
    if (edit || tabParam) history.replaceState(null, "", location.pathname);
    let greet = false;
    try {
      greet = sessionStorage.getItem(GREETING_KEY) === "1";
      sessionStorage.removeItem(GREETING_KEY);
    } catch {}
    if (greet) store.toast(`Здравствуйте, ${admin.name}`);
    // Once, on entering the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fresh = requests.filter((r) => r.status === "new").length;
  const hidden = products.filter((p) => p.hidden).length;
  const sub: Record<Tab, string> = {
    dash: cap(new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })),
    req: count(requests.length, REQUESTS) + (fresh ? ` · ${fresh} ${plural(fresh, "новая", "новые", "новых")}` : ""),
    cat: count(products.length, PICTURES) + (hidden ? ` · ${hidden} скрыто` : ""),
    price: "Цены по стандартным размерам",
    rev: `${reviews.filter((r) => !r.hidden).length} из ${reviews.length} на сайте`,
  };

  const actions: Partial<Record<Tab, ReactNode>> = {
    req: (
      <>
        <Segmented options={VIEWS} value={store.reqView} onChange={store.setReqView} />
        <DsButton onClick={store.newReq}>Новая заявка</DsButton>
      </>
    ),
    cat: <DsButton onClick={store.newProd}>Добавить картину</DsButton>,
    rev: <DsButton onClick={store.addReview}>Добавить отзыв</DsButton>,
  };

  const section = (k: Tab, node: ReactNode) => <Activity mode={tab === k ? "visible" : "hidden"}>{node}</Activity>;

  return (
    <div className={b(null, { bar: mode === "bar" })}>
      <AdminNav />
      <main className={b("main")} data-screen-label={TABS.find(([k]) => k === tab)?.[1]}>
        <div className={b("inner")}>
          <header className={b("head")}>
            <div className={b("heading")}>
              <div className={b("sub")}>{sub[tab]}</div>
              <h1 className={b("title")}>{TITLES[tab]}</h1>
            </div>
            <div className={b("actions")}>{actions[tab]}</div>
          </header>
          {section("dash", <Dashboard />)}
          {section("req", <Requests />)}
          {section("cat", <Catalog />)}
          {section("price", <Prices />)}
          {section("rev", <ReviewsEditor />)}
        </div>
      </main>
      <RequestDrawer open={drawer === "req"} id={store.openId} />
      <ProductDrawer open={drawer === "prod"} edit={store.edit} />
      <Toast text={toastState?.text ?? ""} on={toastOn} onUndo={toastState?.undo && undo} raised={mode === "bar"} />
    </div>
  );
}
