import { Media } from "@/components/ui/Media/Media";
import { FRAMES } from "@/content/site";
import { bem } from "@/lib/bem";
import s from "./FrameCards.module.scss";

const b = bem(s, "frame-cards");

/**
 * Canvas / baguette / glass cards. `home` — 4:3 photos with short notes;
 * `info` («Покупателям») — square photos with the long description.
 */
export function FrameCards({ variant }: { variant: "home" | "info" }) {
  return (
    <div className={b(null, { [variant]: true })}>
      {FRAMES.map((f) => (
        <div key={f.n} className={b("card")}>
          <Media src={f.img} alt={f.n} sizes="(width >= 700px) 33vw, 100vw" className={b("media")} imgClassName={b("img")} />
          <span className={b("name")}>{f.n}</span>
          <span className={b("text")}>{variant === "home" ? f.d : f.long}</span>
        </div>
      ))}
    </div>
  );
}
