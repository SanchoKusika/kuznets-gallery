type Styles = Readonly<Record<string, string>>;
type ModValue = boolean | string | number | null | undefined;
export type Mods = Record<string, ModValue>;

/**
 * BEM class builder over a CSS module.
 *
 *   const b = bem(styles, "header");
 *   b()                          → header
 *   b(null, { scrolled })        → header header--scrolled
 *   b("nav-item", { active })    → header__nav-item header__nav-item--active
 *   b("cell", { size: "lg" })    → header__cell header__cell--size-lg
 */
export function bem(styles: Styles, block: string) {
  return (element?: string | null, mods?: Mods, ...extra: (string | false | null | undefined)[]) => {
    const base = element ? `${block}__${element}` : block;
    const names = [pick(styles, base)];

    if (mods) {
      for (const [key, value] of Object.entries(mods)) {
        if (value === true) names.push(pick(styles, `${base}--${key}`));
        else if (typeof value === "string" || typeof value === "number") {
          names.push(pick(styles, `${base}--${key}-${value}`));
        }
      }
    }

    for (const e of extra) if (e) names.push(e);
    return names.filter(Boolean).join(" ");
  };
}

function pick(styles: Styles, name: string) {
  const cls = styles[name];
  if (process.env.NODE_ENV !== "production" && cls === undefined) {
    console.warn(`[bem] missing class .${name}`);
  }
  return cls;
}
