"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import { FAQ } from "@/content/site";
import { bem } from "@/lib/bem";
import s from "./Faq.module.scss";

const b = bem(s, "faq");

/** FAQ accordion (home and «Покупателям»); the first answer starts open. */
export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className={b()} data-reveal>
      <div className={b("intro")}>
        <div className={b("eyebrow")}>
          <span>(?)</span>
          <span>Частые вопросы</span>
        </div>
        <h2 className={b("title")}>Вопросы, которые задают чаще всего</h2>
      </div>
      <div className={b("list")}>
        {FAQ.map((f, i) => (
          <div key={f.q} className={b("item", { open: open === i })}>
            <button type="button" className={b("question")} aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f.q}</span>
              <span className={b("icon")}>
                <Icon name="plus" size={20} />
              </span>
            </button>
            <div className={b("answer")}>
              <div className={b("answer-inner")}>
                <p className={b("answer-text")}>{f.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
