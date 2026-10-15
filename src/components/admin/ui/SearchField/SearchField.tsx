import { bem } from "@/lib/bem";
import s from "./SearchField.module.scss";

const b = bem(s, "search-field");

type Props = { value: string; onChange: (v: string) => void; placeholder: string };

/** Underline-only small text field (design system `TextField size="sm"`). */
export function SearchField({ value, onChange, placeholder }: Props) {
  return (
    <label className={b()}>
      <input className={b("input")} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}
