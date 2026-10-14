import { Onest, Piazzolla } from "next/font/google";

/** Display, UI and "mono" labels (with tabular-nums). Variable: 400–700 are used. */
export const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

/** Accent serif: ledes, quotes, reviews. Italic only, with the optical-size axis (opsz 30). */
export const piazzolla = Piazzolla({
  subsets: ["latin", "cyrillic"],
  style: "italic",
  axes: ["opsz"],
  variable: "--font-piazzolla",
  display: "swap",
});
