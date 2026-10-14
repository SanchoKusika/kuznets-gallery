import type { Metadata } from "next";
import { NotFound, type HangableWork } from "@/components/not-found/NotFound/NotFound";
import { getCatalog } from "@/lib/catalog";
import { groupThousands } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Страница не найдена" };

const wh = (z: { w: number; h: number }) => `${z.w}×${z.h}`;

/** Every work with the texts of its 404 plate (standard sizes only, thin-space prices, as in the prototype). */
function hangableWorks(): HangableWork[] {
  return getCatalog().map((p) => {
    const sizes = p.sizes.filter((z) => z.p != null);
    const first = sizes[0];
    const last = sizes[sizes.length - 1];
    const prices = sizes.map((z) => z.p as number);
    return {
      code: p.code,
      href: routes.work(p.slug),
      title: p.title,
      src: p.src,
      size: first ? `${wh(first)}${sizes.length > 1 ? ` — ${wh(last)}` : ""} см` : "Размер на заказ",
      price: prices.length ? `от ${groupThousands(Math.min(...prices), " ")} сум` : "Цена по запросу",
    };
  });
}

export default function NotFoundPage() {
  return <NotFound pool={hangableWorks()} />;
}
