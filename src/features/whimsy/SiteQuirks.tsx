"use client";

import { useEffect } from "react";

/** What the tab says while the visitor is elsewhere. */
const AWAY_TITLES = ["Картина скучает по вам", "Вернитесь — холст ещё не высох", "Мы повесим ровно. Вернитесь"];

const CONSOLE_FRAME = `
 ┌─────────────────────────────┐
 │                             │
 │   Kuznetsovs Gallery        │
 │                             │
 └─────────────────────────────┘
`;

/** Small jokes that cost nothing: the tab title when the visitor leaves, a note in the developer console. */
export function SiteQuirks() {
  useEffect(() => {
    let home: string | null = null;
    const onVisibility = () => {
      if (document.hidden) {
        home = document.title;
        document.title = AWAY_TITLES[Math.floor(Math.random() * AWAY_TITLES.length)];
      } else if (home !== null) {
        document.title = home;
        home = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    console.log(`%c${CONSOLE_FRAME}`, "color:#e0502e;font-family:monospace");
    console.log("%cИщете вёрстку? Мы тоже вешаем ровно.", "font:italic 15px Georgia,serif");
  }, []);

  return null;
}
