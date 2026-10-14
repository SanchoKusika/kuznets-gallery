import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Collection } from "@/components/catalog/Collection/Collection";
import { CATS, type CategoryKey } from "@/content/site";
import { getCatalog, inCategory, toCard } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { bem } from "@/lib/bem";
import s from "./page.module.scss";

const b = bem(s, "page");

type Params = PageProps<"/collection/[[...category]]">["params"];

export function generateStaticParams() {
  return [{ category: [] }, ...CATS.map((c) => ({ category: [c.k] }))];
}

/** undefined → all works; a known key → that category; anything else → null (404). */
async function resolveCategory(params: Params): Promise<CategoryKey | "all" | null> {
  const { category } = await params;
  if (!category?.length) return "all";
  const cat = CATS.find((c) => c.k === category[0]);
  return category.length === 1 && cat ? cat.k : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const key = await resolveCategory(params);
  const cat = CATS.find((c) => c.k === key);
  return cat
    ? { title: `${cat.n} — принт-картины`, description: `${cat.d}. В наличии и на заказ, доставка по Узбекистану.` }
    : { title: "Коллекция принт-картин", description: "Все работы галереи: принт-картины на холсте в наличии и на заказ." };
}

// Params are read before rendering (not inside <Suspense>) so an unknown category gets a real
// HTTP 404 instead of a streamed one; every valid URL is prerendered by generateStaticParams anyway.
// `instant = false` allows that block.
export const instant = false;

export default async function CollectionPage({ params }: PageProps<"/collection/[[...category]]">) {
  const key = await resolveCategory(params);
  if (!key) notFound();

  const items = getCatalog();
  const cat = CATS.find((c) => c.k === key);
  const chips = [{ k: "all" as const, short: "Все" }, ...CATS].map((c) => ({
    key: c.k,
    label: c.short,
    count: inCategory(items, c.k).length,
    href: routes.collection(c.k),
    active: c.k === key,
  }));

  return (
    <main className={b()}>
      <Collection title={cat?.title ?? "коллекция"} items={inCategory(items, key).map(toCard)} chips={chips} />
    </main>
  );
}
