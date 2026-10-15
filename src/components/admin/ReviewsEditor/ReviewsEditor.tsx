"use client";

import { Switch } from "@/components/admin/ui/Switch/Switch";
import { useLayout } from "@/features/admin/layout";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./ReviewsEditor.module.scss";

const b = bem(s, "reviews-editor");

/** «Отзывы»: text and name edited in place, visibility, order (= slider order on the site), delete with «Вернуть». */
export function ReviewsEditor() {
  const { tier } = useLayout();
  const { reviews, updateReview, moveReview, deleteReview } = useAdmin();
  return (
    <>
      <p className={b("hint")}>Порядок — как в слайдере на главной. Скрытые отзывы на сайте не показываются.</p>
      <div className={b("list")}>
        {reviews.map((r, i) => (
          <div key={r.id} className={b("item", { hidden: r.hidden, narrow: tier === 0 })}>
            <span className={b("index")}>{String(i + 1).padStart(2, "0")}</span>
            <div className={b("fields")}>
              <textarea className={b("text")} value={r.text} onChange={(e) => updateReview(r.id, { text: e.target.value })} rows={2} placeholder="Текст отзыва" aria-label="Текст отзыва" />
              <input className={b("name")} value={r.name} onChange={(e) => updateReview(r.id, { name: e.target.value })} placeholder="Имя клиента" aria-label="Имя клиента" />
            </div>
            <div className={b("actions")}>
              <Switch on={!r.hidden} label="Показывать на сайте" className={b("switch")} onClick={() => updateReview(r.id, { hidden: !r.hidden }, true)} />
              <button type="button" className={b("move", { off: i === 0 })} aria-label="Выше" onClick={() => moveReview(i, -1)}>
                ↑
              </button>
              <button type="button" className={b("move", { off: i === reviews.length - 1 })} aria-label="Ниже" onClick={() => moveReview(i, 1)}>
                ↓
              </button>
              <button type="button" className={b("remove")} aria-label="Удалить" onClick={() => deleteReview(r.id)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M8 6V4h8v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
