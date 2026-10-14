import Link from "next/link";
import { FrameCards } from "@/components/sections/FrameCards/FrameCards";
import { bem } from "@/lib/bem";
import { routes } from "@/lib/routes";
import s from "./Framing.module.scss";

const b = bem(s, "framing");

export function Framing() {
  return (
    <section className={b()} data-reveal>
      <div className={b("head")}>
        <h2 className={b("title")}>Багет превращает принт в настоящую картину</h2>
        <Link href={routes.info} className={b("link")}>
          Подробнее об оформлении →
        </Link>
      </div>
      <FrameCards variant="home" />
    </section>
  );
}
