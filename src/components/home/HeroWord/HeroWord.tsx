import { bem } from "@/lib/bem";
import s from "./HeroWord.module.scss";

const b = bem(s, "hero-word");

/** Full-width "картины" under the hero; rises from its mask on load (`data-rise`, see Reveal). */
export function HeroWord() {
  return (
    <div className={b()}>
      <h1 className={b("text")} data-rise>
        картины
      </h1>
    </div>
  );
}
