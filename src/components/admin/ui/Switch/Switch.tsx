import type { MouseEvent } from "react";
import { bem } from "@/lib/bem";
import s from "./Switch.module.scss";

const b = bem(s, "switch");

type Props = {
  on: boolean;
  /** Without onClick the switch is a decoration inside a bigger button. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  className?: string;
};

/** 36×20 toggle: ink when on, ink-4 when off (prototype `on3`). */
export function Switch({ on, onClick, label, className }: Props) {
  const cls = b(null, { on }, className);
  const knob = <span className={b("knob")} />;
  return onClick ? (
    <button type="button" role="switch" aria-checked={on} aria-label={label} title={label} className={cls} onClick={onClick}>
      {knob}
    </button>
  ) : (
    <span className={cls} aria-hidden="true">
      {knob}
    </span>
  );
}
