"use client";

import { useCallback, useRef } from "react";
import { flyToOrder } from "./fly-to-order";
import { order, type OrderItem } from "./store";

/**
 * «Добавить в заявку» with the flight: the artwork flies into the header «Заявка» and the line is
 * added as it lands; the drawer stays closed. Without motion, the line is added at once. Presses
 * during the flight are ignored, so it adds one line.
 */
export function useAddToOrder() {
  const flying = useRef(false);

  return useCallback(async (item: Omit<OrderItem, "key">, img: HTMLImageElement | null | undefined, from: Element) => {
    if (flying.current) return;
    flying.current = true;
    await flyToOrder(img, from);
    flying.current = false;
    order.add(item);
  }, []);
}
