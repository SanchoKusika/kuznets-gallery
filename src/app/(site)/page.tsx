import type { Metadata } from "next";
import holst from "@/assets/images/holst.jpg";
import { Categories } from "@/components/home/Categories/Categories";
import { Clients } from "@/components/home/Clients/Clients";
import { Framing } from "@/components/home/Framing/Framing";
import { Hero } from "@/components/home/Hero/Hero";
import { HeroWord } from "@/components/home/HeroWord/HeroWord";
import { Occasions } from "@/components/home/Occasions/Occasions";
import { Reviews } from "@/components/home/Reviews/Reviews";
import { pickTryOn } from "@/components/home/TryOn/pick";
import { TryOn } from "@/components/home/TryOn/TryOn";
import { WaveRibbon } from "@/components/home/WaveRibbon/WaveRibbon";
import { Faq } from "@/components/sections/Faq/Faq";
import { CATS } from "@/content/site";
import { getCatalog, inCategory, toCard } from "@/lib/catalog";
import { getReviews } from "@/lib/reviews";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { alternates: { canonical: routes.home } };

export default async function HomePage() {
  const [items, reviews] = await Promise.all([getCatalog(), getReviews()]);

  const heroThumbs = inCategory(items, "home").slice(0, 9).map(toCard);
  const tryOnWorks = pickTryOn(inCategory(items, "home"), new Set(heroThumbs.map((t) => t.code)));

  // Each category gets a cover not used by the rows above it (prototype `catRows`).
  const usedCovers = new Set<string>();
  const categoryRows = CATS.map((c) => {
    const inCat = inCategory(items, c.k);
    const cover = inCat.find((p) => !usedCovers.has(p.src)) ?? inCat[0];
    if (cover) usedCovers.add(cover.src);
    return {
      key: c.k,
      name: c.n,
      desc: c.d,
      count: inCat.length,
      img: cover?.src ?? holst.src,
      href: routes.collection(c.k),
    };
  });

  const ribbonTitles = [...new Set(items.map((p) => p.title))].slice(0, 14);

  return (
    <>
      <main>
        <Hero thumbs={heroThumbs} total={items.length} />
        <HeroWord />
        <WaveRibbon titles={ribbonTitles} />
        <Categories rows={categoryRows} />
        {tryOnWorks.length > 0 && <TryOn works={tryOnWorks} />}
        <Framing />
        <Occasions />
        <Clients />
        {reviews.length > 0 && <Reviews reviews={reviews} />}
      </main>
      <Faq />
    </>
  );
}
