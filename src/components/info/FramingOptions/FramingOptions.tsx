import wayhome from "@/assets/images/wayhome.jpg";
import { FrameCards } from "@/components/sections/FrameCards/FrameCards";
import { Media } from "@/components/ui/Media/Media";
import { OrderButton } from "@/features/order/OrderButton";
import { bem } from "@/lib/bem";
import s from "./FramingOptions.module.scss";

const b = bem(s, "framing-options");

/** «Холст, багет или стекло» and the custom-size banner that opens the request drawer. */
export function FramingOptions() {
  return (
    <section className={b()} data-reveal>
      <h2 className={b("title")}>Холст, багет или стекло</h2>
      <FrameCards variant="info" />
      <div className={b("custom")}>
        <Media src={wayhome} alt="Картина в интерьере" sizes="(width >= 900px) 50vw, 100vw" className={b("media")} />
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
