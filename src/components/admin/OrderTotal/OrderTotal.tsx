"use client";

import { NumInput } from "@/components/admin/ui/NumInput/NumInput";
import { fmtP } from "@/features/admin/format";
import { reqTotal, type Req } from "@/features/admin/model";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./OrderTotal.module.scss";

const b = bem(s, "order-total");

/**
 * «Итого» of a request: the sum of the lines, or the total agreed with the client typed below it (a discount,
 * a bargain); then the sum of the lines stays as a hint. Empty field — back to the sum.
 */
export function OrderTotal({ r, className }: { r: Req; className?: string }) {
  const { updateReq } = useAdmin();
  const total = reqTotal(r);
  const note = total.deal
    ? `По позициям — ${fmtP(total.lines)}`
    : total.q
      ? "Часть позиций — цена по запросу"
      : total.f
        ? "Без оформления: впишите сумму у позиции"
        : "Доставка — отдельно";
  return (
    <div className={b(null, null, className)}>
      <div className={b("row")}>
        <div>
          <div className={b("label")}>{total.deal ? "Итого по договорённости" : "Итого"}</div>
          <div className={b("note")}>{note}</div>
        </div>
        <div className={b("value")}>{total.t ? fmtP(total.t) : "по запросу"}</div>
      </div>
      <label className={b("deal", { set: total.deal })}>
        <span className={b("deal-label")}>Своя итоговая цена</span>
        <NumInput
          className={b("deal-input")}
          value={r.dealTotal}
          onChange={(v) => updateReq(r.id, { dealTotal: v })}
          digits={11}
          placeholder="не задана — сумма позиций"
          aria-label="Итоговая цена по договорённости"
        />
        <span className={b("deal-unit")}>сум</span>
        {total.deal && (
          <button type="button" className={b("deal-reset")} onClick={() => updateReq(r.id, { dealTotal: null })}>
            Сбросить
          </button>
        )}
      </label>
    </div>
  );
}
