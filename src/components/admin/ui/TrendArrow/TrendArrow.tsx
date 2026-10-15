import type { Arrow } from "@/features/admin/analytics";
import { bem } from "@/lib/bem";
import s from "./TrendArrow.module.scss";

const b = bem(s, "trend-arrow");

/** ↑ in accent / ↓ in ink-3 before a trend (KPIs, sales total); `keep` leaves an empty slot without a trend. */
export function TrendArrow({ arrow, keep }: { arrow: Arrow; keep?: boolean }) {
  return (arrow || keep) && <span className={b(null, { up: arrow?.up })}>{arrow?.arrow}</span>;
}
