/** "90 000 сум"; null → "по запросу" (prototype `fmtP`). */
export function formatPrice(n: number | null | undefined) {
  return n == null ? "по запросу" : `${groupThousands(n)} сум`;
}

/** 90000 → "90 000" (regular space, as in the prototype). */
export function groupThousands(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Russian plural: plural(5, "работа", "работы", "работ") → "работ". */
export function plural(n: number, one: string, few: string, many: string) {
  const x = n % 10;
  const y = n % 100;
  if (x === 1 && y !== 11) return one;
  if (x >= 2 && x <= 4 && (y < 12 || y > 14)) return few;
  return many;
}
