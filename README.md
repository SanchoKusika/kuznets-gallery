# Kuznetsovs Gallery

Сайт kuznets.uz — галерея принт-картин (Ташкент): каталог, карточка работы, заявка, админ-панель и 404.
Собирается по hi-fi прототипам из `design/` (эталон — `*.dc.html`, спецификация — `design/README.md`).

## Стек

- Next.js 16 (App Router, Cache Components), React 19, TypeScript
- SCSS Modules + BEM, токены — CSS-переменные (`src/styles/_tokens.scss`), тёмная тема — `<html data-theme="dark">`
- Шрифты через `next/font`: Onest + Piazzolla Italic (opsz)
- Анимации — Web Animations API и CSS, как в прототипе; плавный скролл — Lenis (только сайт). При `prefers-reduced-motion` всё движение выключено, поэтому сверка с прототипом идёт в этом режиме
- Данные: Supabase — Postgres (каталог, заявки, отзывы, админы), Auth (админка), Storage (картинки работ, бакет `artworks`).
  Схема — `supabase/migrations/`, сайт читает каталог через `'use cache'` с тегами `catalog` / `reviews`
- Хостинг: Cloudflare Workers через `@opennextjs/cloudflare`

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
npx serve design -l 4000   # прототип для сверки: http://localhost:4000/Kuznetsovs%20Gallery.dc.html
```

Проверки: `npx tsc --noEmit`, `npm run lint`, `npm run build` (сборка читает каталог из Supabase).

Переменные окружения — в `.env.local` (образец — `.env.example`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_IMAGE_BASE`, для скриптов — `ADMIN_LOGIN` / `ADMIN_PASSWORD`.

### База данных

| Что | Как |
|---|---|
| Схема, RLS, функции | `supabase/migrations/*.sql` (применяются через Supabase CLI или SQL Editor) |
| Каталог, отзывы и картинки из прототипа | `node --env-file=.env.local scripts/db/import.mjs` — переносит фото с WordPress в Storage; три «оформления» (холст, багет, стекло) картинами не считаются и не импортируются |
| Демо-заявки для аналитики (№ ≤ 1048) | `node --env-file=.env.local scripts/db/demo.mjs`, удалить — `… demo.mjs --purge` |
| Новый админ | в SQL Editor: `select public.create_admin('логин', 'Имя', 'e-mail', 'пароль');` |

### Админка

`/admin` — вход по логину (или e-mail) и паролю через Supabase Auth, сессия в httpOnly-cookie; без «Запомнить это
устройство» cookie живут до закрытия браузера. Панель рендерится на клиенте (раскладка по ширине окна, локальные даты),
правки уходят Server Actions: заявки — с автосохранением 250 мс, каталог, прайс и отзывы — сразу, после чего сайт
пересобирается по тегам `catalog` / `reviews`. `?edit=KZ-001` открывает карточку товара, `?tab=req` — раздел.
Новую картинку можно перетащить на превью в карточке товара: файл уходит в Storage по подписанной ссылке.

На сайте вошедший админ видит плашку «Админка ● N новых» (на странице работы — ещё «Редактировать KZ-xxx»):
при входе ставится метка `kz_admin`, по ней сайт спрашивает `GET /api/admin/badge`, который проверяет сессию.

Картинки работ лежат в Storage, в базе — ключ объекта (путь как на WordPress, `2021/04/….jpg`).
Сайт отдаёт их через `next/image`; адрес бакета — `NEXT_PUBLIC_IMAGE_BASE`.

### Сверка с прототипом

Скрипты в `scripts/visual/` гоняют системный Chrome (`CHROME_PATH`) против `npm run dev` (:3000)
и `npx serve design -l 4000`:

| Скрипт | Что делает |
|---|---|
| `geometry.mjs [ширины] [путь]` | сравнивает позиции и высоты блоков страницы в прототипе и в приложении |
| `compare.mjs <папка> <селектор> [ширины] [темы] [роут] [путь]` | скриншот элемента в обоих и попиксельный дифф (PNG в указанную папку, обычно `.visual/`); `ACTION` — JS перед снимком, `BEFORE` — JS до поиска элемента (например, открыть заявку) |
| `menu.mjs <папка> [ширины]` | мобильное меню: середина анимации, открытое состояние, закрытие |
| `probe.mjs <ширина> "<выражение>"` | вычисляет выражение в обоих и печатает результат |
| `behavior.mjs` | только приложение: тема, «Контакты», меню, заявка, движение (появление, волна, курсор, Lenis), 404, ошибки в консоли |

```bash
node scripts/visual/geometry.mjs 1440,960,375 /
node scripts/visual/compare.mjs .visual/hero "main > :nth-child(1)" 1440,375 light,dark "" /
```

В Git Bash добавляйте `MSYS_NO_PATHCONV=1`, иначе `/` превратится в путь Windows. Для 404 укажите прототип через
`PROTO_URL=http://localhost:4000/404.dc.html`, путь в приложении — любой несуществующий (`/nope`).

## Структура

```
src/
  app/                  маршруты; (site)/ — публичный сайт с шапкой и подвалом
  app/admin/            /admin: вход и панель; actions.ts — Server Actions панели (каждый проверяет сессию)
  app/api/requests/     POST /api/requests: zod-валидация, запись через функцию БД submit_request
  proxy.ts              обновляет сессию админа перед /admin
  components/ui/        примитивы: Button, Media, Icon, Logo, ThemeToggle
  components/layout/    Header, StaggeredMenu, Footer
  components/home/      секции главной
  components/catalog/   Collection, ArtworkCard, ArtworkRow
  components/work/      WorkDetails, NextWork, RelatedWorks
  components/info/      секции «Покупателям»: Pricing, Steps, FramingOptions
  components/sections/  общие секции: Faq, FrameCards
  components/not-found/ страница 404: рама-маятник, этикетка
  components/admin/     админка: вход, навигация, обзор и график, заявки (список, доска, карточка),
                        каталог и карточка товара, прайс, отзывы; ui/ — примитивы дизайн-системы
  features/admin/       модель, состояние панели (store), аналитика обзора, форматирование, серверная часть
  features/             theme, order (заявка и её drawer), catalog (фильтры коллекции),
                        motion (появление при скролле, курсор), scroll (Lenis, блокировка скролла)
  content/site.ts       тексты и справочники из прототипа
  lib/                  каталог и отзывы (Supabase, 'use cache'), заявка (правила и тип), картинки,
                        форматирование, маршруты, bem(); lib/supabase — клиенты и типы БД
  styles/               _tokens.scss, _mixins.scss (подключаются через `@use "mixins" as *;`)
  assets/               логотип и фото для статических импортов
design/                 эталонные прототипы (не входят в сборку)
supabase/migrations/    схема БД
scripts/db/             импорт каталога и картинок, демо-заявки
scripts/visual/         сверка с прототипом
```

## Соглашения

- Один компонент — один BEM-блок и свой `.module.scss`; классы собираются через `bem(styles, "block")`.
- Инлайн-стилей в разметке нет. Исключения — значения, меняющиеся каждый кадр (курсор, волна, маятник 404),
  и геометрия из данных (графики админки); они задаются через `ref.style` или CSS-переменные.
- Картинки каталога берутся по `NEXT_PUBLIC_IMAGE_BASE` (бакет `artworks` в Supabase Storage), адрес сайта для sitemap и canonical — `NEXT_PUBLIC_SITE_URL` (по умолчанию `https://kuznets.uz`).
