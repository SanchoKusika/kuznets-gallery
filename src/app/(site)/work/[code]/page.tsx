import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BackToCollection } from "@/components/work/BackToCollection/BackToCollection";
import { JsonLd } from "@/components/seo/JsonLd";
import { NeighbourWorks } from "@/components/work/NeighbourWorks/NeighbourWorks";
import { RelatedWorks } from "@/components/work/RelatedWorks/RelatedWorks";
import { WorkDetails } from "@/components/work/WorkDetails/WorkDetails";
import { CATS, FMT } from "@/content/site";
import { MeditationTrigger } from "@/features/meditation/Meditation";
import { bem } from "@/lib/bem";
import { getCatalog, toCard } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { artworkData } from "@/lib/structured-data";
import s from "./page.module.scss";

const b = bem(s, "work-page");

/** «Ещё»: 2 rows × 6 columns at the widest (see RelatedWorks.module.scss). */
const RELATED_COUNT = 12;

type Params = PageProps<"/work/[code]">["params"];

export async function generateStaticParams() {
  return (await getCatalog()).map((p) => ({ code: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { work } = await findArtwork((await params).code);
  if (!work) return {};
  return {
    title: `${work.title} — принт-картина ${work.code}`,
    description: describe(work),
    alternates: { canonical: routes.work(work.slug) },
  };
}

/** Meta description: the work's own text, or a general one. */
const describe = (work: { description: string }) => work.description || "Принт-картина на холсте. В наличии и на заказ, доставка по Узбекистану.";

/** The visible catalogue and the artwork with this URL segment in it (codes are case-insensitive). */
async function findArtwork(slug: string) {
  const items = await getCatalog();
  const index = items.findIndex((p) => p.slug === slug.toLowerCase());
  return { items, index, work: items[index] };
}

// Params are read before rendering (not inside <Suspense>) so an unknown code gets a real HTTP 404;
// artworks known at build time are prerendered by generateStaticParams, newer ones render on first visit
// and are cached. `instant = false` allows that block.
export const instant = false;

export default async function WorkPage({ params }: PageProps<"/work/[code]">) {
  const { code } = await params;
  const { items, index, work } = await findArtwork(code);
  if (!work) notFound();
  if (code !== work.slug) permanentRedirect(routes.work(work.slug)); // /work/KZ-001 → /work/kz-001

  // The catalogue from the next work on, wrapping around: the first is the next work, the last the previous one.
  const [next, ...rest] = [...items.slice(index + 1), ...items.slice(0, index)];
  const prev = rest.at(-1) ?? next;
  const category = CATS.find((c) => c.k === work.categories[0]);
  // Uncategorised works fall back to the catalogue's "all" tag, as in the prototype.
  const tag = category?.k ?? "all";
  // Enough for two full rows of the widest grid; other categories only top up a category too small for that.
  const related = [...rest.filter((p) => p.tags.includes(tag)), ...rest.filter((p) => !p.tags.includes(tag))]
    .slice(0, RELATED_COUNT)
    .map(toCard);
  const categoryName = category?.n ?? "Все варианты";

  return (
    <main>
      <JsonLd data={artworkData(work, describe(work))} />
      <div className={b("crumbs")}>
        <BackToCollection label={categoryName} className={b("back")} />
        <MeditationTrigger />
      </div>
      <WorkDetails
        code={work.code}
        image={work.image}
        title={work.title}
        description={work.description}
        src={work.src}
        formatName={FMT[work.format]}
        sizes={work.sizes}
      />
      <NeighbourWorks prev={toCard(prev ?? work)} next={toCard(next ?? work)} />
      <RelatedWorks category={categoryName} cards={related} />
    </main>
  );
}
