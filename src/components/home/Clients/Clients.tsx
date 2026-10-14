import Image from "next/image";
import { CLIENT_LOGOS, CLIENTS } from "@/content/site";
import { bem } from "@/lib/bem";
import { plural } from "@/lib/format";
import s from "./Clients.module.scss";

const b = bem(s, "clients");

/** Client list; with a mouse (≥600px) each row reveals the company logo on hover. */
export function Clients() {
  return (
    <section className={b()} data-reveal>
      <h2 className={b("title")}>
        Нам доверяют {CLIENTS.length} {plural(CLIENTS.length, "компания", "компании", "компаний")}
      </h2>
      <ul className={b("list")}>
        {CLIENTS.map((name) => (
          <li key={name} className={b("item")}>
            <span className={b("name")}>{name}</span>
            {CLIENT_LOGOS[name] && (
              <Image
                src={`/assets/clients/${CLIENT_LOGOS[name]}.jpg`}
                alt=""
                width={300}
                height={100}
                sizes="72px"
                className={b("logo")}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
