"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLastCategory } from "@/features/catalog/last-category";
import { forgetReturn, returnFrom } from "@/features/catalog/return-to-collection";
import { isPlainClick } from "@/lib/plain-click";
import { routes } from "@/lib/routes";

/**
 * "← Коллекция / <category of the work>" that returns to the collection the visitor came from.
 * Opened from that collection page, it goes back in history, so the grid comes back where it was.
 */
export function BackToCollection({ label, className }: { label: string; className?: string }) {
  const category = useLastCategory();
  const pathname = usePathname();
  const router = useRouter();
  const href = routes.collection(category);
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (returnFrom(pathname) !== href || !isPlainClick(e)) return;
        e.preventDefault();
        forgetReturn();
        router.back();
      }}
    >
      ← Коллекция / {label}
    </Link>
  );
}
