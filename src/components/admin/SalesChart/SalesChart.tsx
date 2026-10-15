"use client";

import { useState } from "react";
import { PillSelect } from "@/components/admin/ui/PillSelect/PillSelect";
import { Segmented } from "@/components/admin/ui/Segmented/Segmented";
import { Switch } from "@/components/admin/ui/Switch/Switch";
import { TrendArrow } from "@/components/admin/ui/TrendArrow/TrendArrow";
import { PERIOD_NAME, type ChartOptions, type Metric, type Period, type sales } from "@/features/admin/analytics";
import { useLayout } from "@/features/admin/layout";
import { ADMIN_CATS, SOURCES, type Source } from "@/features/admin/model";
import { bem } from "@/lib/bem";
import s from "./SalesChart.module.scss";

const b = bem(s, "sales");

const METRICS = [
  ["rev", "Выручка"],
  ["cnt", "Заказы"],
  ["avg", "Средний чек"],
] as const satisfies readonly (readonly [Metric, string])[];
const PERIODS = [
  ["30d", "30 дней"],
  ["90d", "3 месяца"],
  ["12m", "12 месяцев"],
] as const satisfies readonly (readonly [Period, string])[];
const SRC_OPTIONS = [{ v: "all", l: "Все источники" }, ...SOURCES.map((x) => ({ v: x, l: x }))];
const DIR_OPTIONS = [{ v: "all", l: "Все направления" }, ...ADMIN_CATS.map((c) => ({ v: c.k, l: c.n }))];

type Props = { data: ReturnType<typeof sales>; options: ChartOptions; onChange: (patch: Partial<ChartOptions>) => void };

/** «Продажи»: total and trend, metric / period / filters, bars with the previous period and a tooltip. */
export function SalesChart({ data, options, onChange }: Props) {
  const { tier } = useLayout();
  const [hover, setHover] = useState<number | null>(null);
  const n = data.bars.length;
  const hov = hover != null && hover < n ? hover : null;
  const right = hov != null && hov < n * 0.6;
  const gap = options.per === "30d" ? (tier === 0 ? 2 : 4) : options.per === "90d" ? 8 : tier === 0 ? 6 : 12;
  const tip = hov != null ? data.bars[hov].tip : null;

  return (
    <section className={b()}>
      <div className={b("top")}>
        <div className={b("summary")}>
          <h2 className={b("title")}>Продажи</h2>
          <div className={b("total-row")}>
            <span className={b("total")}>{data.total}</span>
            <span className={b("unit")}>{data.unit}</span>
          </div>
          <div className={b("trend")}>
            <span className={b("delta")}>
              <TrendArrow arrow={data.arrow} keep />
              <span>{data.delta}</span>
            </span>
            <span className={b("prev")}>{data.prev}</span>
          </div>
        </div>
        <div className={b("switches")}>
          <Segmented tone="paper" options={METRICS} value={options.met} onChange={(met) => onChange({ met })} />
          <Segmented
            tone="paper"
            options={PERIODS}
            value={options.per}
            onChange={(per) => {
              setHover(null);
              onChange({ per });
            }}
          />
        </div>
      </div>

      <div className={b("filters")}>
        <PillSelect aria-label="Источник" options={SRC_OPTIONS} value={options.src} onChange={(v) => onChange({ src: v as Source | "all" })} />
        <PillSelect aria-label="Направление" options={DIR_OPTIONS} value={options.dir} onChange={(dir) => onChange({ dir })} />
        <button type="button" className={b("compare")} aria-pressed={options.cmp} onClick={() => onChange({ cmp: !options.cmp })}>
          <Switch on={options.cmp} />
          <span>Сравнить с прошлым периодом</span>
        </button>
        {options.cmp && (
          <span className={b("legend")}>
            <span className={b("legend-item")}>
              <span className={b("swatch")} />
              {PERIOD_NAME[options.per]}
            </span>
            <span className={b("legend-item")}>
              <span className={b("swatch", { prev: true })} />
              Прошлый период
            </span>
          </span>
        )}
      </div>

      <div className={b("plot", { narrow: tier === 0 })} onMouseLeave={() => setHover(null)}>
        <span className={b("grid", { top: true })} />
        <span className={b("grid", { mid: true })} />
        <span className={b("y", { top: true })}>{data.yTop}</span>
        <span className={b("y", { mid: true })}>{data.yMid}</span>
        <span className={b("y", { zero: true })}>0</span>
        <div className={b("bars", { gap })}>
          {data.bars.map((bar, i) => (
            <div key={i} className={b("bar", { cmp: options.cmp })} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <span className={b("prev-bar", { on: options.cmp })} style={{ height: `${bar.ph}%` }} />
              <span className={b("cur-bar", { hover: hov === i })} style={{ height: `${bar.h}%` }} />
            </div>
          ))}
        </div>
        <span className={b("base")} />
        {tip && hov != null && (
          <div className={b("tip", { right })} style={{ left: `${((right ? hov + 1 : hov) / n) * 100}%` }}>
            <span className={b("tip-title")}>{tip.t}</span>
            <span className={b("tip-value")}>{tip.v}</span>
            {tip.n && <span className={b("tip-line")}>{tip.n}</span>}
            {options.cmp && <span className={b("tip-line", { muted: true })}>{tip.p}</span>}
          </div>
        )}
      </div>
      <div className={b("axis", { narrow: tier === 0, gap })}>
        {data.bars.map((bar, i) => (
          <span key={i} className={b("tick")}>
            {options.per === "12m" && tier === 0 && (n - 1 - i) % 2 ? "" : bar.lab}
          </span>
        ))}
      </div>
    </section>
  );
}
