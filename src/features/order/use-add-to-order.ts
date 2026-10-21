"use client";

import { useCallback, useEffect, useRef } from "react";
import { flyToOrder } from "./fly-to-order";
import { order, type OrderItem } from "./store";

/** Pause between the landing in the header and the drawer opening, ms. */
const OPEN_AFTER_LANDING_MS = 450;

/**
 * «Добавить в заявку» with the flight: the artwork flies into the header «Заявка» first; the line is
 * added as it lands, the drawer opens a moment later (not if the visitor has left the page). Without
 * motion, at once. Presses during the flight are ignored, so it adds one line.
 */
export function useAddToOrder() {
  const flying = useRef(false);
  const openTimer = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(openTimer.current);
    };
  }, []);

  return useCallback(async (item: Omit<OrderItem, "key">, img: HTMLImageElement | null | undefined, from: Element) => {
    if (flying.current) return;
    flying.current = true;
    const flew = await flyToOrder(img, from);
    flying.current = false;
    order.add(item, { open: !flew && mounted.current });
    if (flew && mounted.current) openTimer.current = window.setTimeout(order.open, OPEN_AFTER_LANDING_MS);
  }, []);
}
