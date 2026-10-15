"use client";

import { useRef, useState, type DragEvent } from "react";
import { Chip } from "@/components/admin/ui/Chip/Chip";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { SearchField } from "@/components/admin/ui/SearchField/SearchField";
import { ago, fmtP } from "@/features/admin/format";
import { useLayout } from "@/features/admin/layout";
import { STATUSES, digits, itemsSummary, reqTotal, statusTone, type Req, type Status } from "@/features/admin/model";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./Requests.module.scss";

const b = bem(s, "requests");

const PAGE = 50;
/** «Выполнена» and «Отменена» show at most 8 cards on the board. */
const CLOSED_CAP = 8;

const sumOf = (r: Req) => {
  const t = reqTotal(r).t;
  return t ? fmtP(t) : "по запросу";
};

/** «Заявки»: status chips and search, then a list (50 + «Показать ещё») or a board with drag-and-drop. */
export function Requests() {
  const { tier } = useLayout();
  const { requests, reqFilter, setReqFilter, reqView, visit } = useAdmin();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [seenVisit, setSeenVisit] = useState(visit);
  if (visit !== seenVisit) {
    setSeenVisit(visit);
    setLimit(PAGE);
  }

  const q = query.trim().toLowerCase();
  const qd = digits(q);
  const base = !q
    ? requests
    : requests.filter(
        (r) => `${r.name} ${r.company} ${r.no} ${r.items.map((i) => i.title).join(" ")}`.toLowerCase().includes(q) || (qd.length >= 3 && digits(r.phone).includes(qd)),
      );
  const list = base.filter((r) => reqFilter === "all" || r.status === reqFilter);
  const chips = [{ k: "all" as const, n: "Все" }, ...STATUSES].map((c) => ({
    k: c.k,
    n: c.n,
    count: c.k === "all" ? base.length : base.filter((r) => r.status === c.k).length,
  }));

  return (
    <>
      <div className={b("toolbar")}>
        <div className={b("chips", { scroll: tier === 0 })}>
          {reqView === "list" &&
            chips.map((c) => (
              <Chip
                key={c.k}
                label={c.n}
                count={c.count}
                active={reqFilter === c.k}
                onClick={() => {
                  setReqFilter(c.k);
                  setLimit(PAGE);
                }}
              />
            ))}
        </div>
        <div className={b("search")}>
          <SearchField
            value={query}
            onChange={(v) => {
              setQuery(v);
              setLimit(PAGE);
            }}
            placeholder="Имя, телефон, компания, №"
          />
        </div>
      </div>
      {reqView === "list" ? <List list={list} limit={limit} onMore={() => setLimit((l) => l + PAGE)} /> : <Board base={base} />}
    </>
  );
}

function List({ list, limit, onMore }: { list: Req[]; limit: number; onMore: () => void }) {
  const { tier } = useLayout();
  const { openReq } = useAdmin();
  return (
    <>
      <div className={b("table", { tier })}>
        <div className={b("thead")}>
          <span>№</span>
          <span>Клиент</span>
          <span className={b("full")}>Состав</span>
          <span className={b("wide")}>Сумма</span>
          <span className={b("full")}>Источник</span>
          <span>Статус</span>
          <span className={b("full")}>Получена</span>
        </div>
        {list.slice(0, limit).map((r) => (
          <div key={r.id} className={b("row")} onClick={() => openReq(r.id)}>
            <span className={b("no")}>{`№ ${r.no}`}</span>
            <span className={b("client")}>
              <span className={b("name", { new: r.status === "new" })}>{r.name || "Без имени"}</span>
              <span className={b("sub")}>{r.company ? `${r.company} · ${r.phone}` : r.phone}</span>
            </span>
            <span className={b("what", null, b("full"))}>{itemsSummary(r)}</span>
            <span className={b("sum", null, b("wide"))}>{sumOf(r)}</span>
            <span className={b("src", null, b("full"))}>{r.source}</span>
            <span>
              <StatusPill status={r.status} />
            </span>
            <span className={b("ago", null, b("full"))}>{ago(r.at)}</span>
          </div>
        ))}
        {!list.length && <p className={b("empty")}>Ничего не найдено.</p>}
      </div>
      <div className={b("foot")}>
        <span className={b("shown")}>
          {`Показано ${Math.min(limit, list.length)} из ${list.length}`}
        </span>
        {list.length > limit && (
          <DsButton variant="secondary" onClick={onMore}>
            Показать ещё
          </DsButton>
        )}
      </div>
    </>
  );
}

/** Status capsule with a dot (list rows). */
export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={b("status")}>
      <span className={b("dot", { [statusTone(status)]: true })} />
      {STATUSES.find((x) => x.k === status)?.n}
    </span>
  );
}

function Board({ base }: { base: Req[] }) {
  const { mode } = useLayout();
  const { openReq, setStatus, moveReq, goReq } = useAdmin();
  const dragId = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const dnd = mode !== "bar";

  const start = (e: DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {}
    setTimeout(() => setDragging(id), 0);
  };
  const end = () => {
    dragId.current = null;
    setDragging(null);
    setOver(null);
  };

  return (
    <div className={b("board", { mode })}>
      {STATUSES.map((x, i) => {
        const next = x.k === "done" || x.k === "cancel" ? null : STATUSES[i + 1];
        const all = base.filter((r) => r.status === x.k);
        const cards = all.slice(0, x.k === "done" || x.k === "cancel" ? CLOSED_CAP : Infinity);
        return (
          <div
            key={x.k}
            className={b("column", { over: over === x.k })}
            onDragOver={(e) => {
              if (!dragId.current) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (over !== x.k) setOver(x.k);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
              setOver((o) => (o === x.k ? null : o));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = dragId.current;
              end();
              if (id) moveReq(id, x.k);
            }}
          >
            <div className={b("column-head")}>
              <span className={b("column-name")}>
                <span className={b("column-dot", { [statusTone(x.k)]: true })} />
                {x.n}
              </span>
              <span className={b("column-count")}>{all.length}</span>
            </div>
            {cards.map((r) => (
              <div
                key={r.id}
                className={b("card", { dragging: dragging === r.id })}
                draggable={dnd}
                onDragStart={(e) => start(e, r.id)}
                onDragEnd={end}
                onClick={() => openReq(r.id)}
              >
                <div className={b("card-meta")}>
                  <span>{`№ ${r.no}`}</span>
                  <span>{ago(r.at)}</span>
                </div>
                <div className={b("card-name")}>{r.name || "Без имени"}</div>
                <div className={b("card-what")}>{itemsSummary(r)}</div>
                <div className={b("card-foot")}>
                  <span className={b("card-sum")}>{sumOf(r)}</span>
                  {next && (
                    <button
                      type="button"
                      className={b("advance")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatus(r.id, next.k);
                      }}
                    >
                      {`${next.n} →`}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!all.length && <div className={b("column-empty")}>Пусто</div>}
            {all.length > cards.length && (
              <button type="button" className={b("column-more")} onClick={() => goReq(x.k)}>
                {`Ещё ${all.length - cards.length} — открыть списком →`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
