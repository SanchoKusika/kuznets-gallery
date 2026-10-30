import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { ImageResponse } from "next/og";
import { CATALOG_TAG } from "@/lib/catalog";
import { IMAGE_BASE, SITE_OG_KEY } from "@/lib/images";

// Link previews (app/**/opengraph-image.tsx): what next/og needs besides the layout. Each card is made inside
// `'use cache'` and kept as encoded bytes (next/og reads files as it renders, which would make the route dynamic),
// so the cards are made at build time (a new work's on its first visit) and remade when their tags are updated.

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Cache tag of the site's link preview; the admin updates it after uploading or removing its own picture. */
export const OG_TAG = "og";

/** Site colours on the cards (src/styles/_tokens.scss, light theme). */
export const OG_COLOR = { paper: "#F2EFE9", ink: "#151515", night: "#0D0B0A", accent: "#E0502E" } as const;

/** Pixel size of a JPEG or PNG (next/og needs it to lay an image out). */
function imageSize(b: Uint8Array): { w: number; h: number } | null {
  const u16 = (i: number) => (b[i] << 8) | b[i + 1];
  if (b[0] === 0x89 && b[1] === 0x50) return { w: (u16(16) << 16) | u16(18), h: (u16(20) << 16) | u16(22) };
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  // JPEG: walk the segments to the first frame header (SOF0…SOF15 but DHT, JPG and DAC).
  for (let i = 2; i + 9 < b.length; i += 2 + u16(i + 2)) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: u16(i + 7), h: u16(i + 5) };
  }
  return null;
}

/**
 * An image as a data URI with its size; null when it is missing or not a JPEG or PNG (next/og reads no WebP).
 * A miss is kept for minutes only (a copy may still be uploading), and every entry goes with the catalogue.
 */
export async function ogImage(url: string): Promise<{ src: string; w: number; h: number } | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  const res = await fetch(url).catch(() => null);
  const type = res?.headers.get("content-type") ?? "";
  const bytes = res?.ok && /^image\/(jpeg|png)/.test(type) ? new Uint8Array(await res.arrayBuffer()) : null;
  const size = bytes && imageSize(bytes);
  if (size) cacheLife("max");
  else cacheLife("minutes");
  return bytes && size ? { src: `data:${type};base64,${Buffer.from(bytes).toString("base64")}`, ...size } : null;
}

/** The link preview uploaded in the admin as base64 JPEG; null while there is none. */
export async function customOg(): Promise<string | null> {
  "use cache";
  cacheLife("max");
  cacheTag(OG_TAG);
  // A fresh query, so a CDN copy of the previous upload is not taken for the new one.
  const res = await fetch(`${IMAGE_BASE}${SITE_OG_KEY}?v=${Date.now()}`).catch(() => null);
  if (!res?.ok || !res.headers.get("content-type")?.startsWith("image/jpeg")) return null;
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

/** Onest at `weight`, only the glyphs of `text` (Google Fonts serves TTF to a plain request); null if unreachable. */
export async function ogFont(weight: 400 | 600, text: string): Promise<string | null> {
  "use cache";
  cacheLife("max");
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Onest:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return Buffer.from(await (await fetch(url)).arrayBuffer()).toString("base64");
  } catch {
    return null;
  }
}

/** The fonts option of ImageResponse from ogFont() results (the ones that loaded). */
export const ogFonts = (fonts: [weight: 400 | 600, data: string | null][]) =>
  fonts.flatMap(([weight, data]) => (data ? [{ name: "Onest", data: Buffer.from(data, "base64"), weight, style: "normal" as const }] : []));

/** An encoded card: what a `'use cache'` function can keep. */
export type OgCard = { type: string; data: string };

/**
 * The card as JPEG: a photo card is ~10× lighter than next/og's PNG, and WhatsApp drops heavy previews. Where sharp
 * is not available (Cloudflare Workers) the PNG is kept as it is.
 */
export async function encodeCard(png: ImageResponse): Promise<OgCard> {
  const bytes = Buffer.from(await png.arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    return { type: "image/jpeg", data: (await sharp(bytes).jpeg({ quality: 84, mozjpeg: true }).toBuffer()).toString("base64") };
  } catch {
    return { type: "image/png", data: bytes.toString("base64") };
  }
}

export const cardResponse = ({ type, data }: OgCard) => new Response(Buffer.from(data, "base64"), { headers: { "content-type": type } });
