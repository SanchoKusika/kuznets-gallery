import { createImageUpload, createVariantUploads } from "@/app/admin/actions";
import { bucketKey, IMAGE_BASE, VARIANT_DIR, VARIANT_WIDTHS, variantKey } from "@/lib/images";

// Artwork images in the browser: everything goes to the bucket as WebP, with the copies the site's image loader
// serves (lib/images.ts). Encoding happens here, so it works the same on Vercel and on Cloudflare.

/** Uploaded images keep the long side up to this many pixels. */
export const MAX_SIDE = 3000;
/** Larger files are refused before decoding; what goes up is much smaller. */
export const MAX_FILE_MB = 40;
const QUALITY = 0.9;
const COPY_QUALITY = 0.8;

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

/** WebP of the canvas (a browser that cannot encode it gives PNG: the type says which). */
async function encode(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
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

/** Signed upload of `body` to the bucket. */
async function put(url: string, body: Blob, upsert: boolean) {
  const form = new FormData();
  form.append("cacheControl", "31536000");
  form.append("", body);
  const res = await fetch(url, { method: "PUT", body: form, headers: { "x-upsert": String(upsert) } });
  if (!res.ok) throw new Error(String(res.status));
}

async function uploadCopies(key: string, bitmap: ImageBitmap) {
  const targets = await createVariantUploads(key);
  await Promise.all(targets.map(async ({ width, url }) => put(url, await encode(scaled(bitmap, width), COPY_QUALITY), true)));
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
  const present = await Promise.all(VARIANT_WIDTHS.map((w) => fetch(IMAGE_BASE + variantKey(key, w), { method: "HEAD", cache: "no-store" }).then((r) => r.ok)));
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
