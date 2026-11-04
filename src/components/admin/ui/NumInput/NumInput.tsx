"use client";

import { useState, type InputHTMLAttributes } from "react";
import { num } from "@/features/admin/format";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | null;
  /** A number, or null when the field is emptied (only without `min`). */
  onChange: (v: number | null) => void;
  /** The smallest value; an emptier or smaller entry is not passed on and the field shows the value back on blur. */
  min?: number;
  /** Digits allowed (the server takes up to 999 999 999 for prices). */
  digits?: number;
};

/**
 * Numeric text field: digits only, grouped by thousands while not focused. What is typed stays as it is until it
 * leaves the field, so a quantity can be cleared and retyped.
 */
export function NumInput({ value, onChange, min, digits = 9, onFocus, onBlur, ...rest }: Props) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      {...rest}
      inputMode="numeric"
      value={text ?? (value == null ? "" : num(value))}
      onFocus={(e) => {
        setText(value == null ? "" : String(value));
        onFocus?.(e);
      }}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, "").slice(0, digits);
        setText(d);
        if (!d) {
          if (min == null) onChange(null);
        } else if (min == null || +d >= min) onChange(+d);
      }}
      onBlur={(e) => {
        setText(null);
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        rest.onKeyDown?.(e);
      }}
    />
  );
}
