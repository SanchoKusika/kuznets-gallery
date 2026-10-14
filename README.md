# Kuznetsovs Gallery

Сайт kuznets.uz — галерея принт-картин (Ташкент): каталог, карточка работы, заявка, админ-панель и 404.
Собирается по hi-fi прототипам из `design/` (эталон — `*.dc.html`, спецификация — `design/README.md`).

## Стек

- Next.js 16 (App Router, Cache Components), React 19, TypeScript
- SCSS Modules + BEM, токены — CSS-переменные (`src/styles/_tokens.scss`), тёмная тема — `<html data-theme="dark">`
- Шрифты через `next/font`: Onest + Piazzolla Italic (opsz)
- Анимации — Web Animations API и CSS, как в прототипе; плавный скролл — Lenis (только сайт)
- Данные: Supabase (с этапа 7), до этого — `src/data/products.json`
- Хостинг: Cloudflare Workers через `@opennextjs/cloudflare`

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
npx serve design -l 4000   # прототип для сверки: http://localhost:4000/Kuznetsovs%20Gallery.dc.html
```

Проверки: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

### Сверка с прототипом

Скрипты в `scripts/visual/` гоняют системный Chrome (`CHROME_PATH`) против `npm run dev` (:3000)
и `npx serve design -l 4000`:

| Скрипт | Что делает |
|---|---|
| `geometry.mjs [ширины] [путь]` | сравнивает позиции и высоты блоков страницы в прототипе и в приложении |
| `compare.mjs <папка> <селектор> [ширины] [темы] [роут] [путь]` | скриншот элемента в обоих и попиксельный дифф (PNG в указанную папку, обычно `.visual/`); `ACTION` — JS перед снимком, `BEFORE` — JS до поиска элемента (например, открыть заявку) |
| `menu.mjs <папка> [ширины]` | мобильное меню: середина анимации, открытое состояние, закрытие |
| `probe.mjs <ширина> "<выражение>"` | вычисляет выражение в обоих и печатает результат |
| `behavior.mjs` | только приложение: тема, «Контакты», меню, заявка, ошибки в консоли |

```bash
node scripts/visual/geometry.mjs 1440,960,375 /
node scripts/visual/compare.mjs .visual/hero "main > :nth-child(1)" 1440,375 light,dark "" /
```

В Git Bash добавляйте `MSYS_NO_PATHCONV=1`, иначе `/` превратится в путь Windows.

## Структура

```
src/
  app/                  маршруты; (site)/ — публичный сайт с шапкой и подвалом
  app/api/requests/     POST /api/requests: zod-валидация заявки (запись в БД — этап 7)
  components/ui/        примитивы: Button, Media, Icon, Logo, ThemeToggle
  components/layout/    Header, StaggeredMenu, Footer
  components/home/      секции главной
  components/catalog/   Collection, ArtworkCard, ArtworkRow
  components/work/      WorkDetails, NextWork, RelatedWorks
  components/info/      секции «Покупателям»: Pricing, Steps, FramingOptions
  components/sections/  общие секции: Faq, FrameCards
  features/             theme, order (заявка и её drawer), catalog (фильтры коллекции), scroll, motion
  content/site.ts       тексты и справочники из прототипа
  lib/                  каталог, заявка (правила и тип), картинки, форматирование, маршруты, bem()
  styles/               _tokens.scss, _mixins.scss (подключаются через `@use "mixins" as *;`)
  assets/               логотип и фото для статических импортов
design/                 эталонные прототипы (не входят в сборку)
scripts/visual/         сверка с прототипом
```

## Соглашения

- Один компонент — один BEM-блок и свой `.module.scss`; классы собираются через `bem(styles, "block")`.
- Инлайн-стилей в разметке нет. Исключения — значения, меняющиеся каждый кадр (курсор, волна, маятник 404),
  и геометрия из данных (графики админки); они задаются через `ref.style` или CSS-переменные.
- Картинки каталога берутся по `NEXT_PUBLIC_IMAGE_BASE` (по умолчанию `https://kuznets.uz/wp-content/uploads/`), адрес сайта для sitemap и canonical — `NEXT_PUBLIC_SITE_URL` (по умолчанию `https://kuznets.uz`).
