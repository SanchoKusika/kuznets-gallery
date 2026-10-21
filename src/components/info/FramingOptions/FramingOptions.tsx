import { FrameCards } from "@/components/sections/FrameCards/FrameCards";
import { OrderButton } from "@/features/order/OrderButton";
import { bem } from "@/lib/bem";
import s from "./FramingOptions.module.scss";
import { SizeScheme } from "./SizeScheme";

const b = bem(s, "framing-options");

/** «Холст, багет или стекло» and the custom-size banner that opens the request drawer. */
export function FramingOptions() {
  return (
    <section className={b()} data-reveal>
      <h2 className={b("title")}>Холст, багет или стекло</h2>
      <FrameCards variant="info" />
      <div className={b("custom")}>
        <SizeScheme className={b("media")} />
        <div className={b("custom-body")}>
          <span className={b("label")}>Нестандартный размер</span>
          <span className={b("text")}>Некоторые работы можно сделать с другим соотношением сторон — на заказ</span>
          <OrderButton regular icon="arrow-right" iconEnd className={b("cta")}>
            Обсудить размер
          </OrderButton>
        </div>
      </div>
    </section>
  );
}
