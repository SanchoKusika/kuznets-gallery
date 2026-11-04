import type { SelectHTMLAttributes } from "react";
import { bem } from "@/lib/bem";
import s from "./PillSelect.module.scss";

const b = bem(s, "pill-select");

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> & {
  options: readonly { v: string; l: string }[];
  onChange: (v: string) => void;
  /** Background: `paper` (chart filters, request lines), `soft` paper-2 (catalogue sort), `ink` (on the ink bulk bar). */
  tone?: "paper" | "soft" | "ink";
  /** `sm` — 32px high, for table rows. */
  size?: "md" | "sm";
  /** Takes the width of its cell. */
  block?: boolean;
  /** A first option that cannot be picked back, e.g. «Оформление…» of a bulk action. */
  placeholder?: string;
};

/** Native select styled as a pill with a chevron. */
export function PillSelect({ options, onChange, tone = "paper", size = "md", block, placeholder, className, ...rest }: Props) {
  return (
    <span className={b(null, { block }, className)}>
      <select className={b("select", { [tone]: true, sm: size === "sm" })} onChange={(e) => onChange(e.target.value)} {...rest}>
        {placeholder != null && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <svg className={b("chevron", { sm: size === "sm" })} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}
