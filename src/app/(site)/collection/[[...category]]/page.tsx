import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Collection } from "@/components/catalog/Collection/Collection";
import { JsonLd } from "@/components/seo/JsonLd";
import { CATS, type CategoryKey } from "@/content/site";
import { getCatalog, inCategory, toCard } from "@/lib/catalog";
import { formatPrice, worksWord } from "@/lib/format";
import { routes } from "@/lib/routes";
import { breadcrumbData, COLLECTION_STEP, HOME_STEP } from "@/lib/structured-data";
import { bem } from "@/lib/bem";
import s from "./page.module.scss";

const b = bem(s, "page");

type Params = PageProps<"/collection/[[...category]]">["params"];

export function generateStaticParams() {
  return [{ category: [] }, ...CATS.map((c) => ({ category: [c.k] }))];
}

type Category = (typeof CATS)[number];

/** What people search for, per category: the page title is «… на холсте в Ташкенте». */
const SEARCH_NAME: Record<CategoryKey, string> = {
  home: "Картины для дома",
  kids: "Картины в детскую",
  office: "Картины для офиса",
  public: "Картины для кафе, ресторанов и магазинов",
};

/** No segment → all works; a known key → that category; anything else → null (404). */
async function resolveCategory(params: Params): Promise<{ key: CategoryKey | "all"; cat?: Category } | null> {
  const { category } = await params;
  if (!category?.length) return { key: "all" };
  const cat = CATS.find((c) => c.k === category[0]);
  return category.length === 1 && cat ? { key: cat.k, cat } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resolved = await resolveCategory(params);
  if (!resolved) return {};
  const { key, cat } = resolved;
  const works = inCategory(await getCatalog(), key);
  const prices = works.flatMap((p) => (p.minPrice ? [p.minPrice] : []));
  const range = `${works.length} ${worksWord(works.length)}${prices.length ? `, от ${formatPrice(Math.min(...prices))}` : ""}`;
  return {
    title: `${cat ? SEARCH_NAME[cat.k] : "Коллекция картин"} на холсте в Ташкенте`,
    description: `${cat ? cat.d : "Все работы галереи"}: ${range}. Принт на холсте, в наличии и на заказ, доставка по Узбекистану.`,
    alternates: { canonical: routes.collection(key) },
  };
}

// Params are read before rendering (not inside <Suspense>) so an unknown category gets a real
// HTTP 404 instead of a streamed one; every valid URL is prerendered by generateStaticParams anyway.
// `instant = false` allows that block.
export const instant = false;

export default async function CollectionPage({ params }: PageProps<"/collection/[[...category]]">) {
  const resolved = await resolveCategory(params);
  if (!resolved) notFound();
  const { key, cat } = resolved;

  const items = await getCatalog();
  const chips = [{ k: "all" as const, short: "Все" }, ...CATS].map((c) => ({
    key: c.k,
    label: c.short,
    count: inCategory(items, c.k).length,
    href: routes.collection(c.k),
    active: c.k === key,
  }));

  return (
    <main className={b()}>
      <JsonLd data={breadcrumbData([HOME_STEP, COLLECTION_STEP, ...(cat ? [{ name: cat.n, path: routes.collection(cat.k) }] : [])])} />
      <Collection category={key} title={cat?.title ?? "коллекция"} items={inCategory(items, key).map(toCard)} chips={chips} />
    </main>
  );
}
