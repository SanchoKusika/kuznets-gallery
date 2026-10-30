import type { Metadata } from "next";
import { FramingOptions } from "@/components/info/FramingOptions/FramingOptions";
import { Pricing } from "@/components/info/Pricing/Pricing";
import { Steps } from "@/components/info/Steps/Steps";
import { Faq } from "@/components/sections/Faq/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { bem } from "@/lib/bem";
import { getPriceTable } from "@/lib/catalog";
import { routes } from "@/lib/routes";
import { breadcrumbData, faqData, HOME_STEP } from "@/lib/structured-data";
import s from "./page.module.scss";

const b = bem(s, "info-page");

export const metadata: Metadata = {
  title: "Покупателям — цены, оформление, сроки",
  description:
    "Цены на принт-картины по размерам, холст, багет или стекло, пять шагов от идеи до стены. Изготовление 3–7 дней, доставка по Узбекистану.",
  alternates: { canonical: routes.info },
};

export default async function InfoPage() {
  const prices = await getPriceTable();
  return (
    <>
      <main className={b()}>
        <JsonLd data={faqData()} />
        <JsonLd data={breadcrumbData([HOME_STEP, { name: "Покупателям", path: routes.info }])} />
        <section className={b("intro")} data-reveal>
          <h1 className={b("title")}>покупателям</h1>
          <p className={b("lede")}>Цены, оформление, сроки и доставка. Остались вопросы — звоните, подберём картину под ваш интерьер.</p>
        </section>
        <Pricing rows={prices.rows} min={prices.min} max={prices.max} />
        <Steps />
        <FramingOptions />
      </main>
      <Faq />
    </>
  );
}
