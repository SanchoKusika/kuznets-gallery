"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Logo } from "@/components/ui/Logo/Logo";
import { Media } from "@/components/ui/Media/Media";
import { PRIMARY_PHONE } from "@/content/site";
import { bem } from "@/lib/bem";
import { plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { usePendulum } from "./pendulum";
import s from "./NotFound.module.scss";

const b = bem(s, "not-found");

/** A catalogue work that can be hung in the empty frame, with its plate texts. */
export type HangableWork = { code: string; href: string; title: string; src: string; size: string; price: string };

const LINES = [
  "Рама висит криво. Можно поправить — или потянуть за неё.",
  "Ровно! …было.",
  "Наверное, гвоздь тоже кривой.",
  "Вызвали мастера. Он тоже не нашёл эту страницу.",
  "Хорошо. Это авторский замысел.",
];

function message(fixes: number, art: HangableWork | null) {
  if (art && fixes === 0) return `«${art.title}» — тоже неплохо. Пока ищем страницу, пусть повисит.`;
  if (fixes < LINES.length) return LINES[fixes];
  return `Вы поправили раму ${fixes} ${plural(fixes, "раз", "раза", "раз")}. Это уже перформанс — приходите к нам работать.`;
}

/**
 * 404 (prototype `404.dc.html`): "4 [frame] 4" with the frame swinging on a nail, "Поправить раму",
 * "Повесить что‑нибудь" (a random work from the catalogue, `GET /api/hangable` — loaded here, not passed in: the
 * root not-found rides in every page's payload) and the museum plate.
 */
export function NotFound() {
  const slotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pendulum = usePendulum(slotRef, frameRef, s["not-found__frame--grabbing"]);
  const [fixes, setFixes] = useState(0);
  const [art, setArt] = useState<HangableWork | null>(null);
  const [pool, setPool] = useState<HangableWork[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(routes.hangable)
      .then((r) => (r.ok ? r.json() : []))
      .then((works: HangableWork[]) => alive && setPool(works), () => {});
    return () => {
      alive = false;
    };
  }, []);

  const straighten = () => {
    pendulum.straighten();
    setFixes((n) => n + 1);
  };

  const hang = () => {
    if (!pool.length) return;
    let next: HangableWork;
    do next = pool[Math.floor(Math.random() * pool.length)];
    while (pool.length > 1 && next.code === art?.code);
    pendulum.kick(2.2);
    setArt(next);
  };

  const plate = art
    ? { code: art.code, year: "Временно вместо 404", title: `«${art.title}»`, text: "Принт на холсте, деревянный подрамник. Повесили, чтобы стена не пустовала.", size: art.size, price: art.price }
    : { code: "KZ-404", year: "2026", title: "«Страница, которой нет»", text: "Пустота на холсте, немного кода. Из частной коллекции интернета.", size: "0 × 0 см", price: "Не продаётся" };

  return (
    <div className={b()} data-page="404">
      <header className={b("header")}>
        <Link href={routes.home} aria-label="Kuznetsovs Gallery" className={b("logo")}>
          <Logo className={b("logo-img")} />
        </Link>
        <a href={PRIMARY_PHONE.href} className={b("phone")}>
          {PRIMARY_PHONE.label}
        </a>
      </header>

      <main className={b("main")}>
        <div className={b("digits")} onPointerMove={pendulum.nudge}>
          <span aria-hidden="true">4</span>
          <div ref={slotRef} className={b("slot")}>
            <span className={b("mark")} />
            <div
              ref={frameRef}
              className={b("frame")}
              role="img"
              aria-label={art ? `Картина «${art.title}» в раме` : "Пустая рама"}
              onPointerDown={pendulum.grab}
            >
              <svg className={b("wire")} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                <polyline points="12,20 50,0 88,20" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className={b("baguette")}>
                <div className={b("canvas")}>
                  {art ? (
                    <Media src={art.src} alt={art.title} sizes="(width >= 1400px) 245px, 18vw" className={b("art")} imgClassName={b("art-img")} eager />
                  ) : (
                    <span className={b("canvas-text")}>здесь была страница</span>
                  )}
                </div>
              </div>
            </div>
            <span className={b("nail")} />
          </div>
          <span aria-hidden="true">4</span>
        </div>

        <div className={b("controls")}>
          <div className={b("actions")}>
            <button type="button" className={b("action")} onClick={straighten}>
              Поправить раму
            </button>
            <button type="button" className={b("action")} onClick={hang}>
              {art ? "Повесить другую" : "Повесить что‑нибудь"}
            </button>
          </div>
          <p className={b("message")} aria-live="polite">
            {message(fixes, art)}
          </p>
        </div>

        <div className={b("bottom")}>
          <div className={b("copy")}>
            <span className={b("eyebrow")}>Ошибка 404 · экспонат не найден</span>
            <h1 className={b("title")}>эту страницу уже кто‑то купил</h1>
            <p className={b("lede")}>Или её сняли на реставрацию. Или ссылка висела криво — как эта рама. В коллекции всё на месте, честно.</p>
            <div className={b("ctas")}>
              <Button href={routes.collection()} size="lg" className={b("cta", { primary: true })}>
                Смотреть коллекцию
              </Button>
              <Button href={routes.home} variant="outline" size="lg" className={b("cta")}>
                На главную
              </Button>
            </div>
          </div>

          <div className={b("plate")}>
            <div className={b("plate-head")}>
              <span>{plate.code}</span>
              <span>{plate.year}</span>
            </div>
            <div className={b("plate-body")}>
              <span className={b("plate-title")}>{plate.title}</span>
              <span className={b("plate-text")}>{plate.text}</span>
            </div>
            <div className={b("plate-foot")}>
              <span className={b("plate-size")}>{plate.size}</span>
              <span className={b("plate-price")}>{plate.price}</span>
            </div>
            {art && (
              <Link href={art.href} className={b("plate-link")}>
                Открыть эту картину →
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className={b("footer")}>
        <span>© Kuznetsovs Gallery, Ташкент</span>
        <span>Рамы поправлены: {fixes}</span>
      </footer>
    </div>
  );
}
