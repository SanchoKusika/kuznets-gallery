"use client";

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as api from "@/app/admin/actions";
import { D, isoDay, count, PICTURES } from "./format";
import type { AdminData, AdminUser, Product, ProductDraft, Req, ReqPatch, Review, Status } from "./model";
import { STATUS_NAME, toDraft } from "./model";

export type Tab = "dash" | "req" | "cat" | "price" | "rev";
export const TABS: readonly (readonly [Tab, string])[] = [
  ["dash", "Обзор"],
  ["req", "Заявки"],
  ["cat", "Каталог"],
  ["price", "Прайс"],
  ["rev", "Отзывы"],
];
const TAB_KEY = "kz_admin_tab";

export type ReqFilter = Status | "all";
export type ReqView = "list" | "board";
type Toast = { text: string; undo?: () => void };
/** The product card: a draft of the product being edited or added. */
export type ProductEdit = { draft: ProductDraft; isNew: boolean };

function readTab(): Tab {
  try {
    const t = localStorage.getItem(TAB_KEY);
    if (TABS.some(([k]) => k === t)) return t as Tab;
  } catch {}
  return "dash";
}

/** Debounce of request autosave, as in the prototype. */
const SAVE_DELAY = 250;
const FAILED = "Не удалось сохранить — проверьте соединение";

/** Catalogue order of the panel and the site: sort_order, then code. */
const byOrder = (a: Product, z: Product) => a.sortOrder - z.sortOrder || a.code.localeCompare(z.code);

function useAdminState(admin: AdminUser, initial: AdminData) {
  const [products, setProducts] = useState(initial.products);
  const [requests, setRequests] = useState(initial.requests);
  const [reviews, setReviews] = useState(initial.reviews);
  // The panel renders on the client only, so the last tab (prototype `kz_admin_tab`) is read at once.
  const [tab, setTabState] = useState<Tab>(readTab);
  /** Bumped on every tab switch: lists reset their «Показать ещё» and selection (prototype setTab). */
  const [visit, setVisit] = useState(0);
  const [reqFilter, setReqFilter] = useState<ReqFilter>("all");
  const [reqView, setReqView] = useState<ReqView>("list");
  // Which card is open; the last request and product stay set so a closing card slides out with its content.
  const [drawer, setDrawer] = useState<"req" | "prod" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [edit, setEdit] = useState<ProductEdit | null>(null);
  const [toastState, setToastState] = useState<Toast | null>(null);
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Latest state for callbacks fired later (undo, debounced saves).
  const latest = useRef({ products, requests, reviews });
  useEffect(() => {
    latest.current = { products, requests, reviews };
  });

  const toast = useCallback((text: string, undo?: () => void) => {
    clearTimeout(toastTimer.current);
    setToastState({ text, undo });
    setToastOn(true);
    toastTimer.current = setTimeout(() => setToastOn(false), 6000);
  }, []);

  const undo = useCallback(() => {
    toastState?.undo?.();
    clearTimeout(toastTimer.current);
    setToastOn(false);
  }, [toastState]);

  /** Runs a server action in the background; local state is already updated. */
  const save = useCallback((p: Promise<unknown>) => void p.catch(() => toast(FAILED)), [toast]);

  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    setVisit((v) => v + 1);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
    window.scrollTo(0, 0);
  }, []);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  // —— Requests: local state first, then a debounced save of the merged patch.
  const pending = useRef(new Map<string, ReqPatch>());
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flush = useCallback(() => {
    clearTimeout(saveTimer.current);
    for (const [id, patch] of pending.current) save(api.updateRequest(id, patch));
    pending.current.clear();
  }, [save]);
  useEffect(() => flush, [flush]);

  const updateReq = useCallback(
    (id: string, patch: ReqPatch | ((r: Req) => ReqPatch)) => {
      const r = latest.current.requests.find((x) => x.id === id);
      if (!r) return;
      const p = typeof patch === "function" ? patch(r) : patch;
      setRequests((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));
      pending.current.set(id, { ...pending.current.get(id), ...p });
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flush, SAVE_DELAY);
    },
    [flush],
  );

  /** Status change; «Макет» and «Производство» without a due date get one in 7 days. */
  const setStatus = useCallback(
    (id: string, k: Status) => updateReq(id, (r) => ({ status: k, due: !r.due && (k === "mockup" || k === "prod") ? isoDay(Date.now() + 7 * D) : r.due })),
    [updateReq],
  );

  const openReq = useCallback((id: string) => {
    setOpenId(id);
    setDrawer("req");
  }, []);

  const newReq = useCallback(async () => {
    try {
      const r = await api.createRequest();
      setRequests((list) => [r, ...list]);
      openReq(r.id);
    } catch {
      toast(FAILED);
    }
  }, [openReq, toast]);

  const deleteReq = useCallback(
    (id: string) => {
      const r = latest.current.requests.find((x) => x.id === id);
      if (!r) return;
      pending.current.delete(id);
      setRequests((list) => list.filter((x) => x.id !== id));
      setDrawer(null);
      save(api.deleteRequest(id));
      toast(`Заявка № ${r.no} удалена`, () => {
        setRequests((list) => [...list, r].sort((a, z) => z.at - a.at || z.no - a.no));
        save(api.restoreRequest(r));
      });
    },
    [save, toast],
  );

  /** Board drag-and-drop: move with a toast and «Вернуть». */
  const moveReq = useCallback(
    (id: string, k: Status) => {
      const r = latest.current.requests.find((x) => x.id === id);
      if (!r || r.status === k) return;
      const prev = r.status;
      setStatus(id, k);
      toast(`№ ${r.no}: ${STATUS_NAME[prev]} → ${STATUS_NAME[k]}`, () => updateReq(id, { status: prev }));
    },
    [setStatus, toast, updateReq],
  );

  // —— Catalogue
  const nextCode = useCallback(
    () => `KZ-${String(Math.max(0, ...latest.current.products.map((p) => Number(p.code.match(/\d+/)?.[0] ?? 0))) + 1).padStart(3, "0")}`,
    [],
  );

  const openProd = useCallback(
    (code: string) => {
      const p = latest.current.products.find((x) => x.code === code);
      if (!p) {
        toast(`Картина ${code} удалена из каталога`);
        return;
      }
      setEdit({ draft: toDraft(p), isNew: false });
      setDrawer("prod");
    },
    [toast],
  );

  const newProd = useCallback(() => {
    const top = Math.min(0, ...latest.current.products.map((p) => p.sortOrder));
    setEdit({
      isNew: true,
      draft: toDraft({ code: nextCode(), title: "", description: "", image: "", flatImage: "", sizes: [{ w: 50, h: 50, price: 310000 }], customSizes: [], categories: ["home", "all"], hidden: false, sortOrder: top - 1 }),
    });
    setDrawer("prod");
  }, [nextCode]);

  /** The product card edits a draft; «Сохранить» writes it. */
  const setDraft = useCallback((patch: Partial<ProductDraft> | ((p: ProductDraft) => Partial<ProductDraft>)) => {
    setEdit((e) => (e ? { ...e, draft: { ...e.draft, ...(typeof patch === "function" ? patch(e.draft) : patch) } } : e));
  }, []);

  /** «Дублировать»: the open card becomes a new product with the next code. */
  const duplicateProd = useCallback(() => {
    const top = Math.min(0, ...latest.current.products.map((p) => p.sortOrder));
    setEdit((e) => (e ? { isNew: true, draft: { ...e.draft, code: nextCode(), title: `${e.draft.title} (копия)`, sortOrder: top - 1 } } : e));
    toast("Это копия — проверьте и сохраните");
  }, [nextCode, toast]);

  const saveProd = useCallback(
    (p: Product, isNew: boolean) => {
      setProducts((list) => (isNew ? [p, ...list] : list.map((x) => (x.code === p.code ? p : x))));
      setDrawer(null);
      save(api.saveProduct(p));
      toast(isNew ? `Картина ${p.code} добавлена` : "Изменения сохранены");
    },
    [save, toast],
  );

  const deleteProds = useCallback(
    (codes: string[]) => {
      const prev = latest.current.products;
      const removed = prev.filter((p) => codes.includes(p.code));
      setProducts(prev.filter((p) => !codes.includes(p.code)));
      setDrawer(null);
      save(api.deleteProducts(codes));
      // Undo puts back only the removed products: later edits stay.
      toast(codes.length > 1 ? `Удалено: ${count(codes.length, PICTURES)}` : "Картина удалена", () => {
        setProducts((list) => [...list.filter((p) => !codes.includes(p.code)), ...removed].sort(byOrder));
        save(api.restoreProducts(removed));
      });
    },
    [save, toast],
  );

  const setHidden = useCallback(
    (codes: string[], hidden: boolean, quiet?: boolean) => {
      setProducts((list) => list.map((p) => (codes.includes(p.code) ? { ...p, hidden } : p)));
      save(api.setProductsHidden(codes, hidden));
      if (!quiet) toast(hidden ? `Скрыто с сайта: ${codes.length}` : `Показано на сайте: ${codes.length}`);
    },
    [save, toast],
  );

  /** Price changes: new sizes for the changed products, with «Вернуть». */
  const applySizes = useCallback(
    (next: Product[], message: string) => {
      const prevBy = new Map(latest.current.products.map((p) => [p.code, p]));
      const changed = next.filter((p) => prevBy.get(p.code) !== p);
      const before = new Map(changed.map((p) => [p.code, prevBy.get(p.code)!.sizes]));
      setProducts(next);
      save(api.saveSizes(changed.map((p) => ({ code: p.code, sizes: p.sizes }))));
      // Undo reverts only these sizes: other edits made meanwhile stay.
      toast(message, () => {
        setProducts((list) => list.map((p) => (before.has(p.code) ? { ...p, sizes: before.get(p.code)! } : p)));
        save(api.saveSizes([...before].map(([code, sizes]) => ({ code, sizes }))));
      });
    },
    [save, toast],
  );

  // —— Reviews: edits save after a pause, everything else at once.
  const reviewTimer = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const saveReviewLater = useCallback(
    (id: string) => {
      clearTimeout(reviewTimer.current.get(id));
      reviewTimer.current.set(
        id,
        setTimeout(() => {
          reviewTimer.current.delete(id);
          const r = latest.current.reviews.find((x) => x.id === id);
          if (r) save(api.saveReviews([r]));
        }, 400),
      );
    },
    [save],
  );

  const updateReview = useCallback(
    (id: string, patch: Partial<Review>, immediate?: boolean) => {
      const list = latest.current.reviews.map((r) => (r.id === id ? { ...r, ...patch } : r));
      setReviews(list);
      if (immediate) save(api.saveReviews(list.filter((r) => r.id === id)));
      else saveReviewLater(id);
    },
    [save, saveReviewLater],
  );

  const moveReview = useCallback(
    (i: number, d: -1 | 1) => {
      const a = [...latest.current.reviews];
      const j = i + d;
      if (j < 0 || j >= a.length) return;
      [a[i], a[j]] = [a[j], a[i]];
      const list = a.map((r, k) => ({ ...r, sortOrder: k }));
      setReviews(list);
      save(api.saveReviews(list));
    },
    [save],
  );

  const addReview = useCallback(async () => {
    try {
      const r = await api.createReview(Math.min(0, ...latest.current.reviews.map((x) => x.sortOrder)) - 1);
      setReviews((list) => [r, ...list]);
    } catch {
      toast(FAILED);
    }
  }, [toast]);

  const deleteReview = useCallback(
    (id: string) => {
      const prev = latest.current.reviews;
      const r = prev.find((x) => x.id === id);
      if (!r) return;
      clearTimeout(reviewTimer.current.get(id));
      setReviews(prev.filter((x) => x.id !== id));
      save(api.deleteReview(id));
      toast("Отзыв удалён", () => {
        setReviews((list) => [...list.filter((x) => x.id !== id), r].sort((a, z) => a.sortOrder - z.sortOrder));
        save(api.saveReviews([r]));
      });
    },
    [save, toast],
  );

  // Esc closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  return {
    admin,
    products,
    requests,
    reviews,
    tab,
    setTab,
    visit,
    reqFilter,
    setReqFilter,
    reqView,
    setReqView,
    /** Dashboard links into the request list with a status filter. */
    goReq: (f: ReqFilter) => {
      setReqFilter(f);
      setReqView("list");
      setTab("req");
    },
    drawer,
    openId,
    edit,
    closeDrawer,
    toast,
    toastState,
    toastOn,
    undo,
    updateReq,
    setStatus,
    openReq,
    newReq,
    deleteReq,
    moveReq,
    openProd,
    newProd,
    setDraft,
    duplicateProd,
    saveProd,
    deleteProds,
    setHidden,
    applySizes,
    updateReview,
    moveReview,
    addReview,
    deleteReview,
  };
}

export type AdminStore = ReturnType<typeof useAdminState>;

const AdminContext = createContext<AdminStore | null>(null);

export function AdminProvider({ admin, initial, children }: { admin: AdminUser; initial: AdminData; children: ReactNode }) {
  const store = useAdminState(admin, initial);
  return <AdminContext value={store}>{children}</AdminContext>;
}

export function useAdmin() {
  const store = use(AdminContext);
  if (!store) throw new Error("useAdmin must be used inside <AdminProvider>");
  return store;
}
