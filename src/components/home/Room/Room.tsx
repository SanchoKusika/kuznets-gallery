import room from "@/assets/images/room-tashkent.jpg";
import { Media } from "@/components/ui/Media/Media";
import { bem } from "@/lib/bem";
import s from "./Room.module.scss";

const b = bem(s, "room");

/** Full-bleed interior shot with a caption plate, then a client quote. */
export function Room() {
  return (
    <section className={b()} data-reveal>
      <div className={b("figure")}>
        <Media src={room} alt="Картина в интерьере" sizes="100vw" className={b("media")} imgClassName={b("img")} />
        <div className={b("plate")}>
          <span className={b("plate-label")}>В интерьере</span>
          <span className={b("plate-title")}>Тошкент</span>
          <span className={b("plate-text")}>Холст на подрамнике, печать с высокой точностью цветопередачи</span>
        </div>
      </div>
      <div className={b("quote")}>
        <p className={b("quote-text")}>«Картина круче, чем на фото!»</p>
        <div className={b("quote-meta")}>
          <span className={b("quote-body")}>Не жалею, что заказал именно у вас.</span>
          <span className={b("quote-author")}>— Max Nam, клиент галереи</span>
        </div>
      </div>
    </section>
  );
}
