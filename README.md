# Kuznetsovs Gallery

Сайт kuznets.uz — галерея принт-картин (Ташкент): каталог, карточка работы, заявка, админ-панель и 404.
Собирается по hi-fi прототипам из `design/` (эталон — `*.dc.html`, спецификация — `design/README.md`).

## Стек

- Next.js 16 (App Router, Cache Components), React 19, TypeScript
- SCSS Modules + BEM, токены — CSS-переменные (`src/styles/_tokens.scss`), тёмная тема — `<html data-theme="dark">`
- Шрифты через `next/font`: Onest + Piazzolla Italic (opsz)
- Анимации — Web Animations API и CSS, как в прототипе; плавный скролл — Lenis (только сайт). При `prefers-reduced-motion` всё движение выключено
- Данные: Supabase — Postgres (каталог, заявки, отзывы, админы), Auth (админка), Storage (картинки работ, бакет `artworks`).
  Схема — `supabase/migrations/`, сайт читает каталог через `'use cache'` с тегами `catalog` / `reviews`
- Редактор фото в админке: рамка обрезки — `react-image-crop`, поворот и экспорт — canvas
- Карта в подвале — Яндекс Карты, JS API 3.0 (скрипт с ключом, типы — `@yandex/ymaps3-types`), перекрашенная в палитру подвала; грузится, только когда подвал близко
- Хостинг: демо — Vercel, https://kuznets-gallery.vercel.app (см. «Деплой»); прод kuznets.uz — в планах на Cloudflare Workers

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
npx serve design -l 4000   # прототип для сверки: http://localhost:4000/Kuznetsovs%20Gallery.dc.html
```

Проверки: `npx tsc --noEmit`, `npm run lint`, `npm run build` (сборка читает каталог из Supabase).

Переменные окружения — в `.env.local` (образец — `.env.example`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_IMAGE_BASE`, необязательная `NEXT_PUBLIC_SITE_URL`, ключ карты `YANDEX_MAPS_KEY`, для скриптов —
`ADMIN_LOGIN` / `ADMIN_PASSWORD`. На Vercel — в настройках проекта.

### База данных

| Что | Как |
|---|---|
| Схема, RLS, функции | `supabase/migrations/*.sql` (применяются через Supabase CLI или SQL Editor) |
| Каталог, отзывы и картинки из прототипа | `node --env-file=.env.local scripts/db/import.mjs` — переносит фото с WordPress в Storage; три «оформления» (холст, багет, стекло) картинами не считаются и не импортируются, 11 дублей WordPress (та же картинка) сливаются с оригиналом |
| Ровные фото картин для «Примерьте размер» | `node --env-file=.env.local scripts/db/flat-images.mjs "<папка>"` — файлы «KZ-001 — Название.jpg» → `flat/KZ-001.jpg` в Storage и поле `flat_image`; новой работе — путь в админке |
| Демо-заявки для аналитики (№ ≤ 1048) | `node --env-file=.env.local scripts/db/demo.mjs`, удалить — `… demo.mjs --purge` |
| Новый админ | в SQL Editor: `select public.create_admin('логин', 'Имя', 'e-mail', 'пароль');` (пока админ один — `admin`) |

База — источник правды для каталога: названия, размеры и цены сверены с kuznets.uz, а `import.mjs` при повторном
запуске ничего не перезаписывает — только добавляет недостающие работы (удалённую в админке вернёт). После правок прямо в базе (SQL, скрипты) сайт
не узнает о них сам: откройте любую работу в админке (`/admin?edit=KZ-001`) и нажмите «Сохранить» — это сбросит кеш
по тегу `catalog`. В Storage держим только файлы, на которые ссылается работа или заявка (сейчас 318: у каждой из 159 работ фото в интерьере и ровное фото).

### Админка

`/admin` — вход по логину (или e-mail) и паролю через Supabase Auth, сессия в httpOnly-cookie; без «Запомнить это
устройство» cookie живут до закрытия браузера. Панель рендерится на клиенте (раскладка по ширине окна, локальные даты),
правки уходят Server Actions: заявки — с автосохранением 250 мс, каталог, прайс и отзывы — сразу, после чего сайт
пересобирается по тегам `catalog` / `reviews`. `?edit=KZ-001` открывает карточку товара, `?tab=req` — раздел.
Фото работы меняется в карточке товара: выбранный или перетащенный на превью файл сначала открывается в редакторе
(обрезка — свободно, 1:1, 4:5, 3:4, 4:3, 3:2; поворот на 90°), «Редактировать» на превью открывает текущее фото.
Нетронутый файл уходит как есть, изменённый — JPEG 0.92, длинная сторона до 4000 px; загрузка — в Storage по подписанной
ссылке, в работу фото попадает по «Сохранить».

На сайте вошедший админ видит плашку «Админка ● N новых» (на странице работы — ещё «Редактировать KZ-xxx»):
при входе ставится метка `kz_admin`, по ней сайт спрашивает `GET /api/admin/badge`, который проверяет сессию.

Картинки работ лежат в Storage, в базе — ключ объекта: путь как на WordPress (`2021/04/….jpg`), у новых загрузок —
`ГГГГ/ММ/ИМЯ-xxxxxx.jpg`. Сайт отдаёт их через `next/image`; адрес бакета — `NEXT_PUBLIC_IMAGE_BASE`.

### Деплой

Демо — Vercel, проект `kuznets-gallery` на аккаунте владельца, подключён к GitHub: `main` выкладывается в продакшен
(https://kuznets-gallery.vercel.app), у PR — превью. Бесплатный план Vercel только для некоммерческих сайтов, поэтому
прод kuznets.uz планируется на Cloudflare Workers (код — тег `cloudflare-opennext`, закрытый PR #19; пинг Supabase там — Cron Trigger). Функции работают во Франкфурте (`vercel.json`,
`fra1`), рядом с базой Supabase (eu-central-1).

- Переменные Supabase в проект ставит интеграция Supabase ↔ Vercel (Settings → Environment Variables). Приложение
  берёт из них только `SUPABASE_URL` и `SUPABASE_PUBLISHABLE_KEY`; `NEXT_PUBLIC_IMAGE_BASE` по умолчанию — бакет `artworks`.
- Адрес сайта — `NEXT_PUBLIC_SITE_URL`, а без неё — продакшен-домен проекта Vercel. Индексируется только
  продакшен-сборка для `https://kuznets.uz`: на `*.vercel.app`, в превью PR и в локальной сборке без переменной
  `robots.txt` запрещает всё, а страницы отдают `noindex, nofollow`. Когда kuznets.uz
  станет продакшен-доменом проекта, следующий деплой откроет сайт для поисковиков.
- Ключ Яндекс Карт `YANDEX_MAPS_KEY` (кабинет developer.tech.yandex.ru, «JavaScript API и HTTP Геокодер»)
  читает сервер (в Vercel — sensitive) и передаёт карте; браузер всё равно шлёт его Яндексу, поэтому ключ ограничен по HTTP Referer: `localhost`, `kuznets-gallery.vercel.app`. Маску на `*.vercel.app` Яндекс не принимает, поэтому
  в превью PR вместо карты — «Карта не загрузилась». Для kuznets.uz домен добавляется в ключ (или заводится ключ галереи).
- Кеш `'use cache'` и сброс по тегам `catalog` / `reviews` Vercel поддерживает сам: правки из админки попадают на сайт
  без нового деплоя.
- Vercel Cron (`vercel.json`) раз в день дёргает `GET /api/cron/keepalive` — один запрос к каталогу: бесплатный Supabase
  засыпает после недели без запросов, а посетители получают страницы из кеша и базу не трогают.

### Сверка с прототипом

Приложение и прототип открываются рядом в браузере (`npm run dev` и `npx serve design -l 4000`) и сравниваются по
скриншотам. Экраны этапов 1–9 сверены и приняты; скрипты попиксельной сверки после этого удалены (есть в истории git).

## Структура

```
src/
  app/                  маршруты; (site)/ — публичный сайт с шапкой и подвалом
  app/*.ico|svg|png, manifest.ts, robots.ts, sitemap.ts
                        фавиконки (favicon.ico, icon.svg, apple-icon.png), веб-манифест, robots и sitemap —
                        файлы-соглашения Next.js, теги в <head> он ставит сам
  app/admin/            /admin: вход и панель; actions.ts — Server Actions панели (каждый проверяет сессию)
  app/api/requests/     POST /api/requests: zod-валидация, запись через функцию БД submit_request
  app/api/admin/badge/  GET: число новых заявок для плашки админа (проверяет сессию)
  app/api/cron/keepalive/
                        GET: ежедневный запрос к базе, чтобы Supabase не засыпал (Vercel Cron)
  proxy.ts              обновляет сессию админа перед /admin и /api/admin
  components/ui/        примитивы: Button, Media, Icon, Logo, ThemeToggle, WorkLink (ссылка на работу с предзагрузкой
                        по намерению)
  components/layout/    Header, StaggeredMenu, Footer
  components/home/      секции главной
  components/catalog/   Collection, ArtworkCard, ArtworkRow
  components/work/      WorkDetails, NextWork, RelatedWorks
  components/info/      секции «Покупателям»: Pricing, Steps, FramingOptions
  components/sections/  общие секции: Faq, FrameCards
  components/not-found/ страница 404: рама-маятник, этикетка
  components/admin/     админка: вход, навигация, обзор и график, заявки (список, доска, карточка),
                        каталог, карточка товара и редактор фото, прайс, отзывы; ui/ — примитивы дизайн-системы
  features/admin/       модель, состояние панели (store), аналитика обзора, форматирование, серверная часть
  features/             theme, order (заявка, её drawer и полёт картины в «Заявку»), catalog (фильтры коллекции, возврат «← Коллекция» на то же место сетки, картинка карточки на странице работы),
                        motion (появление при скролле, курсор), scroll (Lenis, блокировка скролла, состояние шапки на <html> — data-scrolled),
                        map (карта подвала: стиль, метки, места, пасхалка с чаем),
                        whimsy (мелочи без веса: «Поправь картину» в сетке коллекции, заголовок вкладки и сообщение в консоли),
                        meditation (режим медитации, клавиша M, только ПК: шёлк из шейдера WebGL и кольцо дыхания)
  content/site.ts       тексты и справочники из прототипа
  lib/                  каталог и отзывы (Supabase, 'use cache'), заявка (правила и тип), картинки,
                        форматирование, маршруты, bem(); lib/supabase — клиенты и типы БД
  styles/               _tokens.scss, _mixins.scss (`@use "mixins" as *;`), _admin.scss — миксины админки
                        (`@use "mixins" as *; @use "admin" as *;`)
  assets/               фото для статических импортов (логотип — вектор в components/ui/Logo)
public/assets/          логотипы клиентов (clients/), иконки веб-манифеста (icons/)
design/                 эталонные прототипы (не входят в сборку)
supabase/migrations/    схема БД
scripts/db/             импорт каталога и картинок, демо-заявки
vercel.json             регион функций и cron на Vercel
```

## Соглашения

- Один компонент — один BEM-блок и свой `.module.scss`; классы собираются через `bem(styles, "block")`.
- Инлайн-стилей в разметке нет. Исключения — значения, меняющиеся каждый кадр (курсор, волна, маятник 404),
  и геометрия из данных (графики админки); они задаются через `ref.style` или CSS-переменные.
- DRY/KISS: повторяющиеся стили — миксины (`_mixins.scss`, в админке `_admin.scss`), повторяющаяся разметка —
  компоненты (`components/ui`, `components/admin/ui`). Новая зависимость — только если без неё заметно сложнее.
- Код и комментарии — на английском, интерфейс и документация — на русском. Форматтера нет: стиль как в соседнем коде,
  длинные строки допустимы.
- Картинки каталога берутся по `NEXT_PUBLIC_IMAGE_BASE` (бакет `artworks` в Supabase Storage), адрес сайта для sitemap и canonical — `NEXT_PUBLIC_SITE_URL` (по умолчанию — продакшен-домен проекта Vercel, вне Vercel — `https://kuznets.uz`).
