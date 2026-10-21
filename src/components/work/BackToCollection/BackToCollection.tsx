"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLastCategory } from "@/features/catalog/last-category";
import { goBackToCollection } from "@/features/catalog/return-to-collection";
import { isPlainClick } from "@/lib/plain-click";
import { routes } from "@/lib/routes";

/**
 * "← Коллекция / <category of the work>" that returns to the collection the visitor came from,
 * to the same place in the grid (return-to-collection.ts); a plain link to it otherwise.
 */
export function BackToCollection({ label, className }: { label: string; className?: string }) {
  const category = useLastCategory();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Link
      href={routes.collection(category)}
      className={className}
      onClick={(e) => {
        if (!isPlainClick(e)) return;
        const handled = goBackToCollection(pathname, () => router.back(), (href) => router.push(href, { scroll: false }));
        if (handled) e.preventDefault();
      }}
    >
      ← Коллекция / {label}
    </Link>
  );
}
