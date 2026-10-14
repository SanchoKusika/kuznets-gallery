"use client";

import Link from "next/link";
import { useLastCategory } from "@/features/catalog/last-category";
import { routes } from "@/lib/routes";

/** "← Коллекция / <category of the work>" that returns to the collection the visitor came from. */
export function BackToCollection({ label, className }: { label: string; className?: string }) {
  const category = useLastCategory();
  return (
    <Link href={routes.collection(category)} className={className}>
      ← Коллекция / {label}
    </Link>
  );
}
