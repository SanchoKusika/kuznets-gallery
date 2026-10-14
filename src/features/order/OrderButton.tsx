"use client";

import { Button, type AsButton } from "@/components/ui/Button/Button";
import { order } from "./store";

/** Button that opens the request drawer (prototype `openCustom` / `openDrawer`). */
export function OrderButton(props: Omit<AsButton, "onClick">) {
  return <Button {...props} onClick={order.open} />;
}
