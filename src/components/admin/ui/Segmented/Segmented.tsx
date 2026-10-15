import { bem } from "@/lib/bem";
import s from "./Segmented.module.scss";

const b = bem(s, "segmented");

type Props<K extends string> = {
  options: readonly (readonly [K, string])[];
  value: K;
  onChange: (k: K) => void;
  /** `soft` — paper-2 track, 16px pills (Список / Доска); `paper` — paper track, 14px pills (chart). */
  tone?: "soft" | "paper";
};

/** Pill group with one active option (requests view, chart metric and period). */
export function Segmented<K extends string>({ options, value, onChange, tone = "soft" }: Props<K>) {
  return (
    <div className={b(null, { [tone]: true })}>
      {options.map(([k, label]) => (
        <button key={k} type="button" className={b("option", { active: k === value })} aria-pressed={k === value} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}
