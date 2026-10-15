import { bem } from "@/lib/bem";
import s from "./Chip.module.scss";

const b = bem(s, "chip");

type Props = { label: string; count?: number; active?: boolean; onClick?: () => void };

/** Filter pill with an optional count; active is ink-filled (design system `Chip`). */
export function Chip({ label, count, active, onClick }: Props) {
  return (
    <button type="button" className={b(null, { active })} aria-pressed={active} onClick={onClick}>
      {label}
      {count != null && <span className={b("count")}>{count}</span>}
    </button>
  );
}
