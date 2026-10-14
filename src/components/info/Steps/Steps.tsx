import { STEPS } from "@/content/site";
import { bem } from "@/lib/bem";
import s from "./Steps.module.scss";

const b = bem(s, "steps");

/** «Пять шагов от идеи до стены». */
export function Steps() {
  return (
    <section className={b()} data-reveal>
      <h2 className={b("title")}>Пять шагов от идеи до стены</h2>
      <ol className={b("list")}>
        {STEPS.map((step) => (
          <li key={step.n} className={b("step")}>
            <span className={b("number")}>{step.n}</span>
            <span className={b("name")}>{step.t}</span>
            <span className={b("text")}>{step.d}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
