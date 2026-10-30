import { createImageUpload, createSiteOgUpload, createVariantUploads, siteOgChanged } from "@/app/admin/actions";
import { bucketKey, IMAGE_BASE, needsOgCopy, OG_COPY_WIDTH, ogCopyKey, VARIANT_DIR, VARIANT_WIDTHS, variantKey } from "@/lib/images";

// Artwork images in the browser: everything goes to the bucket as WebP, with the copies the site's image loader
// serves and a JPEG copy for link previews (lib/images.ts). Encoding happens here, so it works the same on Vercel
// and on Cloudflare.

/** Uploaded images keep the long side up to this many pixels. */
export const MAX_SIDE = 3000;
/** Larger files are refused before decoding; what goes up is much smaller. */
export const MAX_FILE_MB = 40;
const QUALITY = 0.9;
const COPY_QUALITY = 0.8;
const OG_QUALITY = 0.82;

/** File name without the extension; "kartina" when nothing is left. */
export const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "kartina";

function canvasOf(source: CanvasImageSource, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  return c;
}

/** `bitmap` scaled to `width` (never up), halved step by step so that small copies stay sharp. */
function scaled(bitmap: ImageBitmap, width: number) {
  const target = Math.min(width, bitmap.width);
  let source: CanvasImageSource = bitmap;
  let w = bitmap.width;
  let h = bitmap.height;
  while (w / 2 >= target) {
    w = Math.round(w / 2);
    h = Math.round(h / 2);
    source = canvasOf(source, w, h);
  }
  return canvasOf(source, target, Math.max(1, Math.round((bitmap.height * target) / bitmap.width)));
}

/** WebP (or `type`) of the canvas; a browser that cannot encode WebP gives PNG: the type says which. */
async function encode(canvas: HTMLCanvasElement, quality: number, type = "image/webp") {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob) throw new Error("encode");
  return blob;
}

/** The canvas as an upload-ready WebP file, the long side capped at MAX_SIDE. */
export async function canvasToFile(canvas: HTMLCanvasElement, name: string) {
  const long = Math.max(canvas.width, canvas.height);
  const source = long > MAX_SIDE ? canvasOf(canvas, Math.round((canvas.width * MAX_SIDE) / long), Math.round((canvas.height * MAX_SIDE) / long)) : canvas;
  const blob = await encode(source, QUALITY);
  return new File([blob], `${name}.${blob.type === "image/webp" ? "webp" : "png"}`, { type: blob.type });
}

/** Refuses what cannot be an artwork photo; the message is for the toast. */
export function checkFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Это не изображение — нужен JPG, PNG или WebP";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Файл больше ${MAX_FILE_MB} МБ — уменьшите его перед загрузкой`;
  return null;
}

/** Signed upload of `body` to the bucket (cached for a year unless `cacheControl` says otherwise, in seconds). */
async function put(url: string, body: Blob, upsert: boolean, cacheControl = "31536000") {
  const form = new FormData();
  form.append("cacheControl", cacheControl);
  form.append("", body);
  const res = await fetch(url, { method: "PUT", body: form, headers: { "x-upsert": String(upsert) } });
  if (!res.ok) throw new Error(String(res.status));
}

async function uploadCopies(key: string, bitmap: ImageBitmap) {
  const { copies, og } = await createVariantUploads(key);
  const upload = async (url: string, width: number, quality: number, type?: string) => put(url, await encode(scaled(bitmap, width), quality, type), true);
  await Promise.all([...copies.map(({ width, url }) => upload(url, width, COPY_QUALITY)), og && upload(og, OG_COPY_WIDTH, OG_QUALITY, "image/jpeg")]);
}

/**
 * Uploads an artwork image: as WebP with the long side up to MAX_SIDE (a WebP that already fits goes as it is),
 * then its copies. Returns the object key for `products.image`.
 */
export async function uploadImage(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const fits = file.type === "image/webp" && Math.max(bitmap.width, bitmap.height) <= MAX_SIDE;
    const ready = fits ? file : await canvasToFile(canvasOf(bitmap, bitmap.width, bitmap.height), baseName(file.name));
    const { path, url } = await createImageUpload(ready.name);
    await put(url, ready, false);
    await uploadCopies(path, bitmap);
    return path;
  } finally {
    bitmap.close();
  }
}

/**
 * Makes the copies of a bucket image that has none yet, e.g. a path typed into the card by hand.
 * Links elsewhere are shown as they are and need none.
 */
export async function ensureCopies(path: string) {
  const key = bucketKey(path.trim());
  if (!key || key.startsWith(VARIANT_DIR)) return;
  const copies = [...VARIANT_WIDTHS.map((w) => variantKey(key, w)), ...(needsOgCopy(key) ? [ogCopyKey(key)] : [])];
  const present = await Promise.all(copies.map((k) => fetch(IMAGE_BASE + k, { method: "HEAD", cache: "no-store" }).then((r) => r.ok)));
  if (present.every(Boolean)) return;
  const res = await fetch(IMAGE_BASE + key, { cache: "no-store" });
  if (!res.ok) throw new Error(`no image ${key}`);
  const bitmap = await createImageBitmap(await res.blob());
  try {
    await uploadCopies(key, bitmap);
  } finally {
    bitmap.close();
  }
}

/** The site's link preview: 1200×630 (what Telegram, WhatsApp and Facebook expect), JPEG up to this size. */
export const SITE_OG = { w: 1200, h: 630, maxBytes: 300 * 1024 } as const;

/**
 * Uploads the site's own link preview: the picture (framed 1.91:1 in the photo editor) covers 1200×630 and goes
 * as JPEG, its quality lowered step by step until it is under 300 KB (WhatsApp drops heavier previews).
 */
export async function uploadSiteOg(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const source = scaled(bitmap, Math.round(bitmap.width * Math.max(SITE_OG.w / bitmap.width, SITE_OG.h / bitmap.height)));
    const k = Math.max(SITE_OG.w / source.width, SITE_OG.h / source.height);
    const out = document.createElement("canvas");
    out.width = SITE_OG.w;
    out.height = SITE_OG.h;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, (SITE_OG.w - source.width * k) / 2, (SITE_OG.h - source.height * k) / 2, source.width * k, source.height * k);
    let blob = await encode(out, 0.86, "image/jpeg");
    for (const q of [0.78, 0.7, 0.6]) if (blob.size > SITE_OG.maxBytes) blob = await encode(out, q, "image/jpeg");
    // A short cache: a replaced preview shows up within a minute.
    await put(await createSiteOgUpload(), blob, true, "60");
    await siteOgChanged();
  } finally {
    bitmap.close();
  }
}
