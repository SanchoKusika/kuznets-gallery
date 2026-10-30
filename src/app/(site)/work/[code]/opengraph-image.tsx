import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { OgLogo } from "@/features/og/OgLogo";
import { cardResponse, encodeCard, OG_COLOR, OG_SIZE, ogFont, ogFonts, ogImage, type OgCard } from "@/features/og/og";
import { getCatalog, toCard } from "@/lib/catalog";
import { ogImageUrl } from "@/lib/images";

// A work's link preview: the picture on its own colours (itself, blurred and darkened under a veil, so light
// text reads on any work), its title, code, sizes and price, the logo. next/og lays it out from inline styles only.

export const alt = "Принт-картина Kuznetsovs Gallery";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export async function generateStaticParams() {
  return (await getCatalog()).map((p) => ({ code: p.slug }));
}

/** The picture fits this box in the left part of the card. */
const ART = { w: 540, h: 480, cx: 330 };
const TEXT_LEFT = 680;
const BLUR = 40;

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const card = await workCard((await params).code);
  if (!card) notFound();
  return cardResponse(card);
}

/** Remade when the catalogue changes (tag `catalog`); null for an unknown code. */
async function workCard(code: string): Promise<OgCard | null> {
  "use cache";
  cacheLife("max");
  const work = (await getCatalog()).find((p) => p.slug === code.toLowerCase());
  if (!work) return null;
  const card = toCard(work);
  const meta = `${work.code} · ${card.range}`;
  const [art, regular, semibold] = await Promise.all([
    ogImage(ogImageUrl(work.flatSrc ?? work.src)),
    ogFont(400, meta),
    ogFont(600, work.title + card.from),
  ]);
  const k = art ? Math.min(ART.w / art.w, ART.h / art.h) : 0;
  const fit = art && { w: Math.round(art.w * k), h: Math.round(art.h * k) };
  // The background covers the card with room to spare: a blur fades out towards its own edges.
  const cover = art && Math.max((OG_SIZE.width + 6 * BLUR) / art.w, (OG_SIZE.height + 6 * BLUR) / art.h);
  const titleSize = work.title.length <= 10 ? 76 : work.title.length <= 16 ? 62 : 52;
  const textLeft = art ? TEXT_LEFT : 96;

  return encodeCard(
    new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: OG_COLOR.ink, color: OG_COLOR.paper, fontFamily: "Onest", overflow: "hidden" }}>
        {art && cover && fit && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
            <img
              src={art.src}
              width={art.w * cover}
              height={art.h * cover}
              alt=""
              style={{ position: "absolute", left: (OG_SIZE.width - art.w * cover) / 2, top: (OG_SIZE.height - art.h * cover) / 2, filter: `blur(${BLUR}px)` }}
            />
            <div style={{ position: "absolute", left: 0, top: 0, width: OG_SIZE.width, height: OG_SIZE.height, background: "rgba(13,11,10,.55)" }} />
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
            <img
              src={art.src}
              width={fit.w}
              height={fit.h}
              alt=""
              style={{ position: "absolute", left: ART.cx - fit.w / 2, top: (OG_SIZE.height - fit.h) / 2, boxShadow: "0 24px 50px rgba(0,0,0,.4)" }}
            />
          </>
        )}
        <div style={{ position: "absolute", left: textLeft, top: 0, width: OG_SIZE.width - textLeft - 64, height: OG_SIZE.height, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: titleSize, fontWeight: 600, lineHeight: 0.98, letterSpacing: "-0.05em" }}>{work.title}</div>
          <div style={{ fontSize: 26, fontWeight: 400, lineHeight: 1.3, opacity: 0.78, marginTop: 22 }}>{meta}</div>
          <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 14 }}>{card.from}</div>
          <div style={{ display: "flex", marginTop: 60 }}>
            <OgLogo width={260} light />
          </div>
        </div>
      </div>,
      {
        ...OG_SIZE,
        fonts: ogFonts([
          [400, regular],
          [600, semibold],
        ]),
      },
    ),
  );
}
