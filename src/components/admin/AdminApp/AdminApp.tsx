"use client";

import { Activity, useEffect, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav/AdminNav";
import { Catalog } from "@/components/admin/Catalog/Catalog";
import { Dashboard } from "@/components/admin/Dashboard/Dashboard";
import { OgEditor } from "@/components/admin/OgEditor/OgEditor";
import { OrderEditor } from "@/components/admin/OrderEditor/OrderEditor";
import { Prices } from "@/components/admin/Prices/Prices";
import { ProductDrawer } from "@/components/admin/ProductDrawer/ProductDrawer";
import { RequestDrawer } from "@/components/admin/RequestDrawer/RequestDrawer";
import { Requests } from "@/components/admin/Requests/Requests";
import { ReviewsEditor } from "@/components/admin/ReviewsEditor/ReviewsEditor";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { Segmented } from "@/components/admin/ui/Segmented/Segmented";
import { Toast } from "@/components/admin/ui/Toast/Toast";
import { cap, count, dstr, PICTURES, REQUESTS } from "@/features/admin/format";
import { GREETING_KEY } from "@/features/admin/greeting";
import { LayoutContext, useAdminLayout, useLayout } from "@/features/admin/layout";
import { STATUS_NAME, type AdminData, type AdminUser } from "@/features/admin/model";
import { AdminProvider, TABS, useAdmin, type ReqView, type Tab } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { plural } from "@/lib/format";
import s from "./AdminApp.module.scss";

const b = bem(s, "admin");

type Props = { admin: AdminUser; data: AdminData; edit?: string; tab?: string; order?: string };

/**
 * The admin panel (design/Admin.dc.html): navigation, page header, six sections («Превью» has no prototype), drawers
 * and the toast.
 * Rendered on the client only — it lays out by window width and shows local dates and "5 мин назад".
 */
export function AdminApp({ admin, data, edit, tab, order }: Props) {
  const layout = useAdminLayout();
  if (!layout) return null;
  return (
    <LayoutContext value={layout}>
      <AdminProvider admin={admin} initial={data}>
        <Shell edit={edit} tab={tab} order={order} />
      </AdminProvider>
    </LayoutContext>
  );
}

const TITLES: Record<Tab, string> = { dash: "обзор", req: "заявки", cat: "каталог", price: "прайс", rev: "отзывы", og: "превью ссылки" };
const VIEWS = [
  ["list", "Список"],
  ["board", "Доска"],
] as const satisfies readonly (readonly [ReqView, string])[];

function Shell({ edit, tab: tabParam, order: orderParam }: { edit?: string; tab?: string; order?: string }) {
  const { mode } = useLayout();
  const store = useAdmin();
  const { admin, tab, setTab, requests, products, reviews, drawer, toastState, toastOn, undo } = store;

  // Links from the site: /admin?edit=KZ-001 opens the card, ?tab=req a section, ?order=1049 the items of a request
  // on the whole screen; then the URL is cleaned (an open order puts its own back, with «Назад» to the list).
  useEffect(() => {
    const ordered = orderParam ? requests.find((r) => String(r.no) === orderParam) : undefined;
    if (edit || tabParam || orderParam) history.replaceState(null, "", location.pathname);
    if (edit) {
      setTab("cat");
      store.openProd(edit.toUpperCase());
    } else if (ordered) {
      setTab("req");
      store.openOrder(ordered.id);
    } else if (TABS.some(([k]) => k === tabParam)) setTab(tabParam as Tab);
    let greet = false;
    try {
      greet = sessionStorage.getItem(GREETING_KEY) === "1";
      sessionStorage.removeItem(GREETING_KEY);
    } catch {}
    if (greet) store.toast(`Здравствуйте, ${admin.name}`);
    store.sweepOnce();
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
    og: "Картинка, когда делятся ссылкой на сайт",
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

  const order = store.orderId ? requests.find((r) => r.id === store.orderId) : undefined;
  const section = (k: Tab, node: ReactNode) => <Activity mode={tab === k && !order ? "visible" : "hidden"}>{node}</Activity>;

  return (
    <div className={b(null, { bar: mode === "bar" })}>
      <AdminNav />
      <main className={b("main")} data-screen-label={order ? "Состав заказа" : TABS.find(([k]) => k === tab)?.[1]}>
        <div className={b("inner")}>
          {order ? (
            <header className={b("head")}>
              <div className={b("heading")}>
                <button type="button" className={b("back")} onClick={store.closeOrder}>
                  ← Заявки
                </button>
                <div className={b("sub")}>{[`Заявка № ${order.no}`, dstr(order.at), STATUS_NAME[order.status], order.company || order.name].filter(Boolean).join(" · ")}</div>
                <h1 className={b("title")}>состав заказа</h1>
              </div>
              <div className={b("actions")}>
                <DsButton variant="secondary" onClick={() => store.openReq(order.id)}>
                  Карточка заявки
                </DsButton>
                <DsButton onClick={store.closeOrder}>Готово</DsButton>
              </div>
            </header>
          ) : (
            <header className={b("head")}>
              <div className={b("heading")}>
                <div className={b("sub")}>{sub[tab]}</div>
                <h1 className={b("title")}>{TITLES[tab]}</h1>
              </div>
              <div className={b("actions")}>{actions[tab]}</div>
            </header>
          )}
          {order && <OrderEditor key={order.id} r={order} />}
          {section("dash", <Dashboard />)}
          {section("req", <Requests />)}
          {section("cat", <Catalog />)}
          {section("price", <Prices />)}
          {section("rev", <ReviewsEditor />)}
          {section("og", <OgEditor />)}
        </div>
      </main>
      <RequestDrawer open={drawer === "req"} id={store.openId} />
      <ProductDrawer open={drawer === "prod"} edit={store.edit} />
      <Toast text={toastState?.text ?? ""} on={toastOn} onUndo={toastState?.undo && undo} raised={mode === "bar"} />
    </div>
  );
}
