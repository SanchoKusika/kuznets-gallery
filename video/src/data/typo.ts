// Russian typography for on-screen copy (brief 5.2): non-breaking space after short words and
// before a dash, prices with non-breaking thousands, word forms for counts.

export const NBSP ="\u00A0";
const SHORT = ["в", "и", "на", "по", "от", "до", "а", "с", "к", "о", "у", "не", "за", "из", "для"];
const shortRe = new RegExp(`(^|[\\s«(])(${SHORT.join("|")}) `, "giu");

export const typo = (s: string) =>
  s
    .replace(shortRe, (_, pre: string, w: string) => `${pre}${w}${NBSP}`)
    // a second pass catches chains like «и в»
    .replace(shortRe, (_, pre: string, w: string) => `${pre}${w}${NBSP}`)
    .replace(/ (—|–) /g, `${NBSP}$1 `);

/** 310000 → "310 000" with non-breaking spaces. */
export const groupThousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

/** 310000 → "310 000 сум". */
export const formatPrice = (n: number) => `${groupThousands(n)}${NBSP}сум`;

/** Russian plural: plural(5, "работа", "работы", "работ") → "работ". */
export function plural(n: number, one: string, few: string, many: string) {
  const x = n % 10;
  const y = n % 100;
  if (x === 1 && y !== 11) return one;
  if (x >= 2 && x <= 4 && (y < 12 || y > 14)) return few;
  return many;
}

export const worksWord = (n: number) => plural(n, "работа", "работы", "работ");
export const companiesWord = (n: number) => plural(n, "компания", "компании", "компаний");
