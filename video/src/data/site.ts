// Static site content copied from src/content/site.ts (the video cannot import the site).
// Keep in sync by hand; images of FRAMES are not used here.

export const CONTACTS = {
  phones: [
    { href: "tel:+998903165913", label: "+998 90 316 59 13", name: "Алексей" },
    { href: "tel:+998935043719", label: "+998 93 504 37 19", name: "Ольга" },
  ],
  instagram: { href: "https://www.instagram.com/kuznetsovsgallery/", handle: "@kuznetsovsgallery" },
} as const;

export const FRAMES = [
  { n: "Холст на подрамнике", note: "Входит в цену", d: "Холст со специальным покрытием, натянутый на деревянный подрамник." },
  { n: "Холст с подрамником + багет", note: "Расчёт отдельно", d: "Багетная рамка, изготовленная нашими мастерами, превращает принт в настоящую картину." },
  { n: "Бумага в рамке под стеклом", note: "Расчёт отдельно", d: "Печать на бумаге в рамке со стеклом — лёгкий вариант для небольших форматов." },
] as const;

export const CLIENTS = [
  "Pepsi", "Red Bull", "Kapitalbank", "NBU", "Anorbank", "Sanoat Qurilish Bank", "Click", "Humo Arena",
  "Iteca Exhibitions", "United Cement Group", "Uzcopper", "ADM Global", "Safia", "Beanberry",
  "Community Coffee Bar", "Мята Lounge", "Apexpizza", "Sherin", "The Wax Bar", "Befit One", "Hair Boss",
  "Space Coworking", "Ground Zero", "Tenet", "Shavi", "Prestige Travel", "Comfort Plaza", "Atom Stroy",
  "Betomax", "Carbon", "Agrover", "Alimkhanov Pharm Group", "Asia Pharm Consulting", "Bavaria Reha",
  "De Factum Laboratories", "Referans", "Онкологический центр РУз", "Школа Al-Xorazmiy", "Webnow", "Восток",
  "Мой Бухгалтер", "Западня",
] as const;

export const STEPS = [
  { n: "1", t: "Выбор", d: "Выбираете работу из коллекции или присылаете свою идею." },
  { n: "2", t: "Макет", d: "Дизайнер готовит макет под размер и интерьер." },
  { n: "3", t: "Утверждение", d: "Согласовываем макет, размер и оформление." },
  { n: "4", t: "Печать", d: "Печать на холсте и натяжка на подрамник — 3–7 дней." },
  { n: "5", t: "Доставка", d: "Самовывоз или доставка по всему Узбекистану." },
] as const;
