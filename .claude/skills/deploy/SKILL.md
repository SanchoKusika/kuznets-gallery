---
name: deploy
description: Деплой Kuznets Gallery — Vercel (демо), планы на Cloudflare Workers для kuznets.uz, переменные Supabase, cron против засыпания базы, ключ Яндекс Карт. Читать перед работой с деплоем, доменом, vercel.json, переменными окружения или картой в подвале.
---

# Деплой

- Vercel (проект `kuznets-gallery` на аккаунте владельца, подключён к GitHub): мерж в `main` выкладывает продакшен — это демо на kuznets-gallery.vercel.app, у PR — превью.
- Переменные Supabase ставит интеграция Supabase ↔ Vercel; индексируется только kuznets.uz (`src/lib/site-url.ts`); cron в `vercel.json` раз в день обращается к базе, чтобы Supabase не заснул.
- Прод kuznets.uz — в планах на Cloudflare Workers (Vercel Hobby запрещает коммерческие сайты), код — тег `cloudflare-opennext` (закрытый PR #19); там этот пинг нужен как Cron Trigger.
- Карта в подвале — Яндекс Карты, ключ `YANDEX_MAPS_KEY` (Vercel, sensitive) ограничен по Referer: `localhost`, `kuznets-gallery.vercel.app`; при переезде на kuznets.uz добавить домен в ключ (или завести ключ галереи), в превью PR карты нет.
