// All on-screen copy of both videos (brief 9.3). Typography (non-breaking spaces) is applied here.

import { CLIENTS, CONTACTS } from "./site";
import { companiesWord, typo, worksWord } from "./typo";
import { WORKS_COUNT } from "./art";

/** «{n} авторских работ» with the right word form; n comes from the counter. */
const worksTitle = (n: number) => `${n}\u00A0авторских ${worksWord(n)}`;

export const copy = {
  reels: {
    hook: typo("чего не хватает этой стене?"),
    labels: { home: "ДЛЯ ДОМА", kids: "ДЛЯ ДЕТСКОЙ", office: "ДЛЯ ОФИСА", cafe: "ДЛЯ КАФЕ" },
    wallTitle: worksTitle,
    wallSub: typo("больше их нигде нет"),
    customTitle: typo("нет нужной? сделаем по вашей идее"),
    /** Joined with « → ». */
    customSteps: ["идея", "макет", "печать · 3–7\u00A0дней"],
    ctaLine1: typo("авторские картины в наличии и на заказ"),
    ctaLine2: typo("от 90\u00A0000\u00A0сум · доставка по Узбекистану"),
    /** The pill of the CTA: both phones of the gallery (the owner chose them over «заявка — в директ»). */
    ctaPhones: CONTACTS.phones.map((p) => p.label.replace(/ /g, " ")),
    ctaSite: "kuznets.uz",
    /** Size caption of the sketch in R6. */
    sketchSize: "85\u00A0×\u00A050\u00A0см",
  },
  promo: {
    eyebrow: typo("KUZNETSOVS GALLERY — ТАШКЕНТ"),
    hero: "картины",
    lede: typo("Авторские принт-картины — от восточной мозаики до поп-арта. В наличии и на заказ."),
    halls: ["для дома", "для детской", "для офиса", "для общественных мест"],
    hover: "смотреть",
    canvasOnStretcher: "холст на подрамнике",
    wallTitle: worksTitle,
    wallSub: typo("больше их нигде нет"),
    framingTitle: typo("багет превращает принт в настоящую картину"),
    stepsTitle: typo("от идеи до стены — 3–7 дней"),
    clientsCount: CLIENTS.length,
    /** «нам доверяют 42 компании»; the number is painted accent by the scene. */
    clientsLine: (n: number) => ({ before: "нам доверяют ", number: String(n), after: ` ${companiesWord(n)}` }),
    stats: [
      ["от 90\u00A0000\u00A0сум", "за картину"],
      ["3–7\u00A0дней", "изготовление"],
      [`${WORKS_COUNT}\u00A0${worksWord(WORKS_COUNT)}`, "в коллекции"],
      ["Узбекистан", "доставка по стране"],
    ] as const,
    contacts: `kuznets.uz · ${CONTACTS.phones[0].label.replace(/ /g, "\u00A0")} · ${CONTACTS.instagram.handle}`,
  },
} as const;
