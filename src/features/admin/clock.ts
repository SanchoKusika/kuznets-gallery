"use client";

import { useEffect, useState } from "react";

/** Current time for "5 мин назад" and due dates, refreshed every minute. */
export function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}
