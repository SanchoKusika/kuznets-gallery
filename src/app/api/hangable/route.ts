import type { HangableWork } from "@/components/not-found/NotFound/NotFound";
import { getCatalog } from "@/lib/catalog";
import { groupThousands } from "@/lib/format";
import { routes } from "@/lib/routes";

const wh = (z: { w: number; h: number }) => `${z.w}×${z.h}`;

/**
 * Every work the 404 can hang in its frame, with the texts of its plate (standard sizes only, thin-space prices, as
 * in the prototype). The 404 fetches it itself: the root not-found is part of every page's payload, so a pool passed
 * as a prop rode along on every page (~70 KB). Static, rebuilt with the catalogue's tag.
 */
export async function GET() {
  const works = (await getCatalog()).map((p): HangableWork => {
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
      price: prices.length ? `от ${groupThousands(Math.min(...prices), " ")} сум` : "Цена по запросу",
    };
  });
  return Response.json(works);
}
