// Site content — copied 1:1 from the prototype's script constants.

import baget from "@/assets/images/baget.jpg";
import holst from "@/assets/images/holst.jpg";
import steklo from "@/assets/images/steklo.jpg";

export type CategoryKey = "home" | "kids" | "office" | "public";
export type FormatKey = "sq" | "v" | "h";

export const CONTACTS = {
  phones: [
    { href: "tel:+998903165913", label: "+998 90 316 59 13", name: "Алексей" },
    { href: "tel:+998935043719", label: "+998 93 504 37 19", name: "Ольга" },
  ],
  instagram: { href: "https://www.instagram.com/kuznetsovsgallery/", handle: "@kuznetsovsgallery" },
} as const;

export const PRIMARY_PHONE = CONTACTS.phones[0];

export const CATS: readonly {
  k: CategoryKey;
  n: string;
  short: string;
  d: string;
  title: string;
}[] = [
  { k: "home", n: "Для дома", short: "Для дома", d: "Оригинальные решения для домашнего интерьера", title: "для дома" },
  { k: "kids", n: "Для детской", short: "Детская", d: "Оригинальные решения для детской комнаты", title: "для детской" },
  { k: "office", n: "Для офиса", short: "Офис", d: "Оригинальные решения для офисного интерьера", title: "для офиса" },
  { k: "public", n: "Для общественных мест", short: "Общественные места", d: "Магазины, кафе, рестораны, спортивные залы", title: "общественные места" },
];

export const FMT: Record<FormatKey, string> = { sq: "Квадрат", v: "Вертикаль", h: "Горизонталь" };

export const FRAMES = [
  {
    n: "Холст на подрамнике",
    img: holst,
    note: "Входит в цену",
    d: "Холст со специальным покрытием, натянутый на деревянный подрамник.",
    long: "В большинстве случаев мы используем холст со специальным покрытием. Печать на принтере с высоким разрешением и точностью цветопередачи, затем холст натягивается на деревянный подрамник нужного размера.",
  },
  {
    n: "Холст с подрамником + багет",
    img: baget,
    note: "Расчёт отдельно",
    d: "Багетная рамка, изготовленная нашими мастерами, превращает принт в настоящую картину.",
    long: "Обрамлённая в багет, изготовленный нашими мастерами, печать на холсте примет вид настоящей картины. Цвет и профиль багета подбираем под интерьер.",
  },
  {
    n: "Бумага в рамке под стеклом",
    img: steklo,
    note: "Расчёт отдельно",
    d: "Печать на бумаге в рамке со стеклом — лёгкий вариант для небольших форматов.",
    long: "Печать на бумаге, оформленная в рамку под стекло. Подходит для небольших форматов, графики и детских комнат.",
  },
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

export const CLIENT_LOGOS: Record<string, string> = {
  Pepsi: "pepsi", "Red Bull": "redbull", Kapitalbank: "kapitalbank", NBU: "nbu", Anorbank: "anorbank",
  "Sanoat Qurilish Bank": "sqb", Click: "click", "Humo Arena": "humo-arena", "Iteca Exhibitions": "iteca",
  "United Cement Group": "ucg", Uzcopper: "uzcopper", Safia: "safia", Beanberry: "beanberry",
  "Community Coffee Bar": "community", "Мята Lounge": "myata", Apexpizza: "apexpizza", Sherin: "sherin",
  "The Wax Bar": "wax-bar", "Befit One": "befit", "Hair Boss": "hairboss", "Space Coworking": "cspace",
  "Ground Zero": "ground-zero", Tenet: "tenet", Shavi: "shavi", "Prestige Travel": "prestige-travel",
  "Comfort Plaza": "comfort-plaza", "Atom Stroy": "atom-stroy", Betomax: "betomax", Carbon: "carbon",
  Agrover: "agrover", "Alimkhanov Pharm Group": "alimkhanov", "Asia Pharm Consulting": "asia-pharm",
  "Bavaria Reha": "bavaria-reha", "De Factum Laboratories": "defactum", Referans: "referans",
  "Онкологический центр РУз": "onkologiya", "Школа Al-Xorazmiy": "al-xorazmiy", Webnow: "webnow",
  "Восток": "vostok", "Мой Бухгалтер": "mybuh", "ADM Global": "adm-global", "Западня": "zapadnya",
};

export const FAQ = [
  { q: "Сколько это стоит?", a: "Цена зависит от размера и объёма работы дизайнера, если картина делается на заказ. Например, 50/50 см — от 310 000 сум, 100/100 см — от 825 000 сум. Чем больше размер, тем выгоднее цена." },
  { q: "Из чего это делается?", a: "В большинстве случаев — холст со специальным покрытием. Картины печатаются на принтере с высоким разрешением и точностью цветопередачи, затем холст натягивается на деревянный подрамник нужного размера." },
  { q: "Срок изготовления?", a: "От 3 до 7 дней после того, как вы утвердили макет. Также можно выбрать из того, что есть в наличии, и забрать сразу." },
  { q: "Есть ли доставка?", a: "Доставка есть по всему Узбекистану, оплачивается отдельно." },
  { q: "Можно другой размер?", a: "Некоторые варианты можно сделать с другим соотношением сторон — на заказ." },
  { q: "Можно сделать картину по своей идее?", a: "Да. Дизайнер подготовит макет, стоимость зависит от размера и объёма работы." },
] as const;

export const STEPS = [
  { n: "1", t: "Выбор", d: "Выбираете работу из коллекции или присылаете свою идею." },
  { n: "2", t: "Макет", d: "Дизайнер готовит макет под размер и интерьер." },
  { n: "3", t: "Утверждение", d: "Согласовываем макет, размер и оформление." },
  { n: "4", t: "Печать", d: "Печать на холсте и натяжка на подрамник — 3–7 дней." },
  { n: "5", t: "Доставка", d: "Самовывоз или доставка по всему Узбекистану." },
] as const;

export const SPECS = [
  { k: "Материал", v: "Холст со специальным покрытием, деревянный подрамник" },
  { k: "Печать", v: "Высокое разрешение и точная цветопередача" },
  { k: "Срок", v: "В наличии — забрать сразу; на заказ — 3–7 дней после утверждения макета" },
  { k: "Доставка", v: "По всему Узбекистану, оплачивается отдельно" },
  { k: "Формат", v: "Другое соотношение сторон — на заказ" },
] as const;
