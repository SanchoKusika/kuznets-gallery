import type { FormatKey } from "@/content/site";
import type { Artwork, ArtworkSize } from "@/lib/catalog";
import { routes } from "@/lib/routes";

/** A work offered in «Примерьте размер»: plain data for the client component. */
export type TryOnWork = { code: string; href: string; title: string; image: string; src: string; flatSrc: string; sizes: ArtworkSize[] };

const COUNT = 6;
const FORMATS: FormatKey[] = ["h", "sq", "v"];

/**
 * Six works for «Примерьте размер»: with a flat photo and at least two priced sizes, formats taken
 * in turn (horizontal, square, vertical), skipping the works the hero already shows.
 */
export function pickTryOn(works: Artwork[], skip: ReadonlySet<string>): TryOnWork[] {
  const pool = works.filter((p): p is Artwork & { flatSrc: string } => p.flatSrc != null && !skip.has(p.code) && p.sizes.filter((z) => z.p).length >= 2);
  const byFormat = FORMATS.map((f) => pool.filter((p) => p.format === f));
  const picked: typeof pool = [];
  for (let i = 0; picked.length < COUNT && byFormat.some((list) => i < list.length); i++) {
    for (const list of byFormat) if (list[i] && picked.length < COUNT) picked.push(list[i]);
  }
  return picked.map((p) => ({
    code: p.code,
    href: routes.work(p.slug),
    title: p.title,
    image: p.image,
    src: p.src,
    flatSrc: p.flatSrc,
    sizes: p.sizes.filter((z) => z.p),
  }));
}
