import Link from "next/link";
import { CATS, CONTACTS } from "@/content/site";
import { bem } from "@/lib/bem";
import { routes } from "@/lib/routes";
import { InstagramGlyph } from "./InstagramGlyph";
import { Location } from "./Location/Location";
import s from "./Footer.module.scss";

const b = bem(s, "footer");

const NAV = [
  { n: "Главная", href: routes.home },
  { n: "Вся коллекция", href: routes.collection() },
  ...CATS.map((c) => ({ n: c.n, href: routes.collection(c.k) })),
  { n: "Покупателям", href: routes.info },
];

export function Footer() {
  return (
    <footer id="contacts" className={b()}>
      <div className={b("grid")}>
        <div className={b("call")}>
          <span className={b("label")}>Остались вопросы? Звоните</span>
          <div className={b("phones")}>
            {CONTACTS.phones.map((p) => (
              <div key={p.href} className={b("phone")}>
                <a href={p.href} className={b("phone-link")}>
                  {p.label}
                </a>
                <span className={b("phone-name")}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Location />

        <div className={b("col")}>
          <span className={b("label")}>Галерея</span>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={b("nav-link")}>
              {n.n}
            </Link>
          ))}
        </div>

        <div className={b("col")}>
          <span className={b("label")}>Соцсети</span>
          <a href={CONTACTS.instagram.href} className={b("instagram")}>
            <InstagramGlyph className={b("instagram-icon")} />
            {CONTACTS.instagram.handle}
          </a>
          <span className={b("note")}>Доставка по всему Узбекистану, оплачивается отдельно</span>
        </div>
      </div>

      <div className={b("wordmark")}>
        kuznetsovs<span className={b("wordmark-accent")}>gallery</span>
      </div>

      <div className={b("bottom")}>
        <span>© Kuznetsovs Gallery, Ташкент</span>
        <span>Принт-картины в наличии и на заказ</span>
        <Link href={routes.admin} prefetch={false} className={b("staff")}>
          Вход для сотрудников
        </Link>
      </div>
    </footer>
  );
}
