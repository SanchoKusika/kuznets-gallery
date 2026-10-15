"use client";

import { useState } from "react";
import { SalesChart } from "@/components/admin/SalesChart/SalesChart";
import { Thumb } from "@/components/admin/ui/Thumb/Thumb";
import { TrendArrow } from "@/components/admin/ui/TrendArrow/TrendArrow";
import { useNow } from "@/features/admin/clock";
import { kpis, sales, PERIOD_NAME, type ChartOptions } from "@/features/admin/analytics";
import { ago, count, D, dstr, REQUESTS } from "@/features/admin/format";
import { useLayout } from "@/features/admin/layout";
import { ACTIVE, STATUS_NAME, digits, statusTone, itemsSummary, type Status } from "@/features/admin/model";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./Dashboard.module.scss";

const b = bem(s, "dashboard");

/** «Обзор»: KPIs, waiting requests, due dates, stages, sales chart and breakdowns. */
export function Dashboard() {
  const { mw } = useLayout();
  const { requests, products, goReq, openReq, openProd } = useAdmin();
  const [chart, setChart] = useState<ChartOptions>({ met: "rev", per: "30d", src: "all", dir: "all", cmp: true });
  const now = useNow();

  const k = kpis(requests, now);
  const data = sales(requests, products, chart);
  const fresh = requests.filter((r) => r.status === "new");
  const active = requests.filter((r) => ACTIVE.includes(r.status));
  const cnt = (st: Status) => requests.filter((r) => r.status === st).length;

  const waiting = [...fresh].sort((a, z) => a.at - z.at).slice(0, 5);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const dueAll = active.filter((r) => r.due).sort((a, z) => a.due.localeCompare(z.due));
  const stageKeys: Status[] = ["new", ...ACTIVE];
  const smax = Math.max(1, ...stageKeys.map(cnt));

  const kpiCols = mw >= 900 ? 4 : mw >= 300 ? 2 : 1;
  const triCols = mw >= 1000 ? 3 : mw >= 620 ? 2 : 1;
  const compact = mw < 420;
  const perName = PERIOD_NAME[chart.per];

  const cards = [
    { l: "Новые заявки", v: k.fresh.v, unit: "", dot: k.fresh.dot, arrow: null, sub: k.fresh.sub, go: () => goReq("new") },
    { l: "В работе", v: k.active.v, unit: "", dot: false, arrow: null, sub: k.active.sub, go: () => goReq("all") },
    { l: "Выручка за 30 дней", v: k.revenue.v, unit: "сум", dot: false, arrow: k.revenue.arrow, sub: k.revenue.sub, go: () => setChart((c) => ({ ...c, met: "rev", per: "30d" })) },
    { l: "Средний чек", v: k.average.v, unit: "сум", dot: false, arrow: k.average.arrow, sub: k.average.sub, go: () => setChart((c) => ({ ...c, met: "avg", per: "30d" })) },
  ];

  return (
    <>
      <div className={b("kpis", { cols: kpiCols })}>
        {cards.map((c) => (
          <button key={c.l} type="button" className={b("kpi", { compact })} onClick={c.go}>
            <span className={b("caption")}>{c.l}</span>
            <span className={b("kpi-value-row")}>
              <span className={b("kpi-value")}>{c.v}</span>
              <span className={b("kpi-unit")}>{c.unit}</span>
            </span>
            <span className={b("kpi-sub")}>
              {c.dot && <span className={b("kpi-dot")} />}
              <TrendArrow arrow={c.arrow} />
              <span>{c.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={b("tri", { cols: triCols })}>
        <section className={b("card", { column: true })}>
          <CardHead title="Ждут ответа" count={fresh.length || ""} />
          {waiting.map((r) => (
            <div key={r.id} className={b("wait")}>
              <button type="button" className={b("row")} onClick={() => openReq(r.id)}>
                <span className={b("row-text")}>
                  <span className={b("row-name")}>{r.name || "Без имени"}</span>
                  <span className={b("row-sub", { clip: true })}>{itemsSummary(r)}</span>
                </span>
                <span className={b("row-meta")}>
                  {now - r.at > D && <span className={b("late")} />}
                  <span>{ago(r.at)}</span>
                </span>
              </button>
              <a href={`tel:+${digits(r.phone)}`} aria-label="Позвонить" title={r.phone ? `Позвонить: ${r.phone}` : "Позвонить"} className={b("call")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
                </svg>
              </a>
            </div>
          ))}
          {!waiting.length && <p className={b("empty")}>Все новые заявки разобраны.</p>}
          <button type="button" className={b("more")} onClick={() => goReq("new")}>
            Все новые заявки →
          </button>
        </section>

        <section className={b("card", { column: true })}>
          <CardHead title="Ближайшие сроки" count={dueAll.length || ""} />
          {dueAll.slice(0, 5).map((r) => {
            const dd = new Date(`${r.due}T00:00`);
            const left = Math.round((+dd - +t0) / D);
            return (
              <button key={r.id} type="button" className={b("row", { bleed: true })} onClick={() => openReq(r.id)}>
                <span className={b("row-text")}>
                  <span className={b("row-name")}>{r.name || "Без имени"}</span>
                  <span className={b("row-sub")}>
                    {`${STATUS_NAME[r.status]} · до ${dstr(dd)}`}
                  </span>
                </span>
                <span className={b("row-meta")}>
                  {left <= 0 && <span className={b("late")} />}
                  <span>{left < 0 ? `просрочено ${-left} дн` : left === 0 ? "сегодня" : `через ${left} дн`}</span>
                </span>
              </button>
            );
          })}
          {!dueAll.length && <p className={b("empty")}>Сроки не назначены.</p>}
        </section>

        <section className={b("card", { column: true })}>
          <CardHead title="Этапы" count={count(active.length + fresh.length, REQUESTS)} />
          {stageKeys.map((st) => (
            <button key={st} type="button" className={b("stage")} onClick={() => goReq(st)}>
              <span className={b("stage-dot", { [statusTone(st)]: true })} />
              <span className={b("stage-name")}>{STATUS_NAME[st]}</span>
              <span className={b("track")}>
                <span className={b("fill", { [statusTone(st)]: true })} style={{ width: `${(cnt(st) / smax) * 100}%` }} />
              </span>
              <span className={b("stage-count")}>{cnt(st)}</span>
            </button>
          ))}
        </section>
      </div>

      <SalesChart data={data} options={chart} onChange={(patch) => setChart((c) => ({ ...c, ...patch }))} />

      <div className={b("tri", { cols: triCols })}>
        <Breakdown title="Источники" period={perName} rows={data.sources} />
        <Breakdown title="Направления" period={perName} rows={data.directions} />
        <section className={b("card")}>
          <CardHead title="Популярные картины" count={perName} caption spacing={10} />
          {data.popular.map((p) => (
            <button key={p.code} type="button" className={b("popular")} onClick={() => openProd(p.code)}>
              <span className={b("popular-i")}>{p.i}</span>
              <Thumb image={p.image} sizes="44px" className={b("popular-thumb")} />
              <span className={b("row-text")}>
                <span className={b("popular-title")}>{p.title}</span>
                <span className={b("popular-code")}>{p.code}</span>
              </span>
              <span className={b("popular-sum")}>
                <span className={b("popular-q")}>{p.q}</span>
                <span className={b("popular-r")}>{p.r}</span>
              </span>
            </button>
          ))}
          {!data.popular.length && <p className={b("empty")}>Нет продаж за период.</p>}
        </section>
      </div>
    </>
  );
}

function CardHead({ title, count, caption, spacing = 8 }: { title: string; count: string | number; caption?: boolean; spacing?: 8 | 10 | 18 }) {
  return (
    <div className={b("card-head", { spacing })}>
      <h2 className={b("card-title")}>{title}</h2>
      <span className={b(caption ? "card-period" : "card-count")}>{count}</span>
    </div>
  );
}

function Breakdown({ title, period, rows }: { title: string; period: string; rows: { n: string; pct: number; sub: string }[] }) {
  return (
    <section className={b("card")}>
      <CardHead title={title} count={period} caption spacing={18} />
      <div className={b("shares")}>
        {rows.map((r) => (
          <div key={r.n} className={b("share")}>
            <div className={b("share-head")}>
              <span className={b("share-name")}>{r.n}</span>
              <span className={b("share-pct")}>{`${r.pct}%`}</span>
            </div>
            <span className={b("track")}>
              <span className={b("fill", { ink: true })} style={{ width: `${r.pct}%` }} />
            </span>
            <span className={b("share-sub")}>{r.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
