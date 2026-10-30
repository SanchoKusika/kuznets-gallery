import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/content/site";
import { OgLogo } from "@/features/og/OgLogo";
import { cardResponse, customOg, encodeCard, OG_COLOR, OG_SIZE, ogImage, type OgCard } from "@/features/og/og";
import { getCatalog } from "@/lib/catalog";
import { ogImageUrl } from "@/lib/images";

// The site's link preview (home, collection, «Покупателям»; a work has its own): the picture uploaded in the admin
// («Превью»), or else the meditation mode's grid of pictures turned −12° under a light in the middle
// (features/meditation/GridMotion) with the logo on paper over it. next/og lays the card out from inline styles only.

export const alt = SITE_TITLE;
export const size = OG_SIZE;
export const contentType = "image/jpeg";

const ROWS = 5;
const PER_ROW = 11;
const TILE = { w: 136, h: 170 };
const GAP = 12;
const PLANE = { w: 1700, h: ROWS * TILE.h + (ROWS - 1) * GAP };
/** Each row starts this much further left, so the columns run slanted across the turned plane. */
const ROW_SHIFT = 61;
/** Works on the card, from the start of the catalogue. */
const WORKS = 18;
const LOGO = 540;
const CARD = { padX: 72, padY: 52 };

export default async function Image() {
  return cardResponse(await siteCard());
}

/** Remade when the admin changes the picture (tag `og`) or the catalogue changes (tag `catalog`). */
async function siteCard(): Promise<OgCard> {
  "use cache";
  cacheLife("max");
  const custom = await customOg();
  if (custom) return { type: "image/jpeg", data: custom };
  const works = (await getCatalog()).slice(0, WORKS);
  const tiles = (await Promise.all(works.map((w) => ogImage(ogImageUrl(w.flatSrc ?? w.src))))).filter((t) => t !== null);
  const cardW = LOGO + 2 * CARD.padX;
  const cardH = (LOGO * 192) / 499 + 2 * CARD.padY;

  return encodeCard(
    new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: OG_COLOR.night, overflow: "hidden" }}>
        {tiles.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: (OG_SIZE.width - PLANE.w) / 2,
              top: (OG_SIZE.height - PLANE.h) / 2,
              width: PLANE.w,
              height: PLANE.h,
              display: "flex",
              flexDirection: "column",
              gap: GAP,
              transform: "rotate(-12deg)",
            }}
          >
            {Array.from({ length: ROWS }, (_, r) => (
              <div key={r} style={{ display: "flex", gap: GAP, marginLeft: -r * ROW_SHIFT - 40 }}>
                {Array.from({ length: PER_ROW }, (_, i) => {
                  const tile = tiles[(r * 7 + i * 3) % tiles.length];
                  // The light: tiles fade with their distance from the middle of the card.
                  const dx = i * (TILE.w + GAP) - 300 - r * ROW_SHIFT;
                  const dy = r * (TILE.h + GAP) - 360;
                  const spot = Math.max(0, 1 - Math.hypot(dx, dy * 1.4) / 720);
                  return (
                    // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>
                    <img key={i} src={tile.src} width={TILE.w} height={TILE.h} alt="" style={{ objectFit: "cover", opacity: 0.32 + 0.68 * spot }} />
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div style={{ position: "absolute", left: 0, top: 0, width: OG_SIZE.width, height: OG_SIZE.height, backgroundImage: "radial-gradient(circle at 50% 50%, rgba(13,11,10,0) 55%, rgba(13,11,10,.6) 100%)" }} />
        <div
          style={{
            position: "absolute",
            left: (OG_SIZE.width - cardW) / 2,
            top: (OG_SIZE.height - cardH) / 2,
            width: cardW,
            height: cardH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 22,
            background: OG_COLOR.paper,
            boxShadow: "0 30px 70px rgba(0,0,0,.5)",
          }}
        >
          <OgLogo width={LOGO} />
        </div>
      </div>,
      OG_SIZE,
    ),
  );
}
