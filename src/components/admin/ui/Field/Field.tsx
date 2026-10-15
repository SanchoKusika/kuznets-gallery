import type { ReactNode } from "react";
import { bem } from "@/lib/bem";
import s from "./Field.module.scss";

const b = bem(s, "field");

/** Caption over a control (login and drawers); the control brings its own underline style. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={b(null, null, className)}>
      <span className={b("label")}>{label}</span>
      {children}
    </label>
  );
}
