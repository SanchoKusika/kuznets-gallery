import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NextWork } from "@/components/work/NextWork/NextWork";
import { RelatedWorks } from "@/components/work/RelatedWorks/RelatedWorks";
import { WorkDetails } from "@/components/work/WorkDetails/WorkDetails";
import { CATS, FMT } from "@/content/site";
import { bem } from "@/lib/bem";
import { getArtwork, getCatalog, toCard } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import s from "./page.module.scss";

const b = bem(s, "work-page");

type Params = PageProps<"/work/[code]">["params"];

export function generateStaticParams() {
  return getCatalog().map((p) => ({ code: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const work = getArtwork((await params).code);
  if (!work) return {};
  return {
    title: `${work.title} — принт-картина ${work.code}`,
    description: work.description || "Принт-картина на холсте. В наличии и на заказ, доставка по Узбекистану.",
    openGraph: { images: [work.src] },
  };
}

// Params are read before rendering (not inside <Suspense>) so an unknown code gets a real HTTP 404;
// every artwork is prerendered by generateStaticParams anyway. `instant = false` allows that block.
export const instant = false;

export default async function WorkPage({ params }: PageProps<"/work/[code]">) {
  const work = getArtwork((await params).code);
  if (!work) notFound();

  const items = getCatalog();
  const next = items[(items.indexOf(work) + 1) % items.length];
  const category = CATS.find((c) => c.k === work.categories[0]);
  // Uncategorised works fall back to the catalogue's "all" tag, as in the prototype.
  const tag = category?.k ?? "all";
  const related = items
    .filter((p) => p !== work && p.tags.includes(tag))
    .slice(0, 4)
    .map(toCard);
  const categoryName = category?.n ?? "Все варианты";

  return (
    <main>
      <div className={b("crumbs")}>
        <Link href={routes.collection(category?.k)} className={b("back")}>
          ← Коллекция / {categoryName}
        </Link>
        <span>{work.code}</span>
      </div>
      <WorkDetails
        code={work.code}
        title={work.title}
        description={work.description}
        src={work.src}
        formatName={FMT[work.format]}
        sizes={work.sizes}
      />
      <NextWork card={toCard(next)} />
      <RelatedWorks category={categoryName} cards={related} />
    </main>
  );
}
