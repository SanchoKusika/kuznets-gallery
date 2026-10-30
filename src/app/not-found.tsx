import type { Metadata } from "next";
import { NotFound } from "@/components/not-found/NotFound/NotFound";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFoundPage() {
  return <NotFound />;
}
