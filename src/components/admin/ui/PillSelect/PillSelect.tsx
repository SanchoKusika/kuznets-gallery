import type { SelectHTMLAttributes } from "react";
import { bem } from "@/lib/bem";
import s from "./PillSelect.module.scss";

const b = bem(s, "pill-select");

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  options: readonly { v: string; l: string }[];
  onChange: (v: string) => void;
  /** Background: `paper` (chart filters) or `soft` paper-2 (catalogue sort). */
  tone?: "paper" | "soft";
};

/** Native select styled as a pill with a chevron. */
export function PillSelect({ options, onChange, tone = "paper", ...rest }: Props) {
  return (
    <span className={b()}>
      <select className={b("select", { [tone]: true })} onChange={(e) => onChange(e.target.value)} {...rest}>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <svg className={b("chevron")} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}
