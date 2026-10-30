"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Chip } from "@/components/admin/ui/Chip/Chip";
import { Drawer } from "@/components/admin/ui/Drawer/Drawer";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { baseName, canvasToFile } from "@/features/admin/images";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./PhotoEditor.module.scss";

const b = bem(s, "photo-editor");

const ASPECTS: readonly (readonly [string, number | undefined])[] = [
  ["Свободно", undefined],
  ["1:1", 1],
  ["4:5", 4 / 5],
  ["3:4", 3 / 4],
  ["4:3", 4 / 3],
  ["3:2", 3 / 2],
];
const FULL: PercentCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };

type Props = {
  open: boolean;
  /** A picked file or the URL of the current photo. */
  source: File | string;
  /** Caption at the top, e.g. "KZ-001 · Фото". */
  caption: string;
  /** A fixed frame instead of the choice of ratios, e.g. ["1,91 : 1", 1200 / 630] for a link preview. */
  frame?: readonly [label: string, ratio: number];
  onCancel: () => void;
  /** Uploads the result (a picked file goes as it is when nothing was changed). */
  onDone: (file: File) => Promise<void>;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Storage sends CORS headers, so the canvas stays readable
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** The largest centred frame of `aspect` on a w×h picture; no aspect — the whole picture. */
const fit = (aspect: number | undefined, w: number, h: number): PercentCrop =>
  aspect ? centerCrop(makeAspectCrop({ unit: "%", ...(w / h > aspect ? { height: 100 } : { width: 100 }) }, aspect, w, h), w, h) : FULL;

const isWhole = (c: PercentCrop) => c.x < 0.5 && c.y < 0.5 && c.width > 99.5 && c.height > 99.5;

const sourceName = (source: File | string) => baseName(typeof source === "string" ? source.split("/").pop()! : source.name);

/** The framed part of the canvas as a WebP file (the long side capped, as every upload). */
function cropToFile(canvas: HTMLCanvasElement, crop: PercentCrop, name: string) {
  const sx = (crop.x / 100) * canvas.width;
  const sy = (crop.y / 100) * canvas.height;
  const sw = Math.max(1, Math.round((crop.width / 100) * canvas.width));
  const sh = Math.max(1, Math.round((crop.height / 100) * canvas.height));
  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  out.getContext("2d")!.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvasToFile(out, name);
}

/**
 * Photo editor over the product card (react-image-crop): free or fixed-ratio crop, 90° turns, reset.
 * The picture is drawn turned on a full-size canvas, which is both the crop area and the export source.
 * Mounted anew for every photo (it slides in) and kept while closed, so it slides out with its content.
 * Photos come prepared, so it is a safety net: an unchanged file is uploaded as it is.
 */
export function PhotoEditor({ open, source, caption, frame, onCancel, onDone }: Props) {
  const { toast } = useAdmin();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const locked = frame?.[1];
  const [aspect, setAspect] = useState<number | undefined>(locked);
  const [crop, setCrop] = useState<PercentCrop>(FULL);
  const [pending, setPending] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const url = typeof source === "string" ? source : URL.createObjectURL(source);
    let alive = true;
    loadImage(url).then(
      (img) => {
        if (!alive) return;
        setImage(img);
        if (locked) setCrop(fit(locked, img.naturalWidth, img.naturalHeight));
      },
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
      if (typeof source !== "string") URL.revokeObjectURL(url);
    };
  }, [source, locked]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    const side = rotation % 180 !== 0;
    canvas.width = side ? image.naturalHeight : image.naturalWidth;
    canvas.height = side ? image.naturalWidth : image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  }, [image, rotation]);

  // While uploading the editor stays open, so the result cannot land in the card after «Отмена».
  const close = () => {
    if (!pending) onCancel();
  };

  // Esc closes the editor only: caught before the store's listener that closes the product card.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (!pending) onCancel();
    };
    addEventListener("keydown", onKey, { capture: true });
    return () => removeEventListener("keydown", onKey, { capture: true });
  }, [open, pending, onCancel]);

  const pickAspect = (a: number | undefined) => {
    const canvas = canvasRef.current;
    setAspect(a);
    if (canvas) setCrop(fit(a, canvas.width, canvas.height));
  };

  /** The whole picture, or the largest centred frame when the frame is fixed (`w`×`h` — the turned canvas). */
  const whole = (w: number, h: number) => (locked ? fit(locked, w, h) : FULL);

  const turn = (deg: number) => {
    const next = (rotation + deg + 360) % 360;
    setRotation(next);
    setAspect(locked);
    if (!image) return setCrop(FULL);
    const [w, h] = next % 180 ? [image.naturalHeight, image.naturalWidth] : [image.naturalWidth, image.naturalHeight];
    setCrop(whole(w, h));
  };

  const reset = () => {
    setRotation(0);
    setAspect(locked);
    setCrop(image ? whole(image.naturalWidth, image.naturalHeight) : FULL);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const changed = rotation !== 0 || !isWhole(crop);
    // Nothing changed: the current photo stays, a picked file goes up untouched.
    if (!changed && typeof source === "string") return onCancel();
    setPending(true);
    try {
      const file = changed ? await cropToFile(canvas, crop, sourceName(source)) : (source as File);
      await onDone(file);
    } catch {
      toast("Не удалось подготовить изображение");
    } finally {
      setPending(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      head={caption}
      footer={
        <>
          <button type="button" className={b("reset")} onClick={reset}>
            Сбросить
          </button>
          <div className={b("actions")}>
            <DsButton variant="ghost" onClick={close} disabled={pending}>
              Отмена
            </DsButton>
            <DsButton onClick={save} disabled={!image || pending}>
              {pending ? "Загрузка…" : "Загрузить"}
            </DsButton>
          </div>
        </>
      }
    >
      <div className={b("stage")}>
        {image ? (
          <ReactCrop className={b("crop")} crop={crop} aspect={aspect} keepSelection ruleOfThirds onChange={(_, percent) => setCrop(percent)}>
            <canvas ref={canvasRef} className={b("canvas")} />
          </ReactCrop>
        ) : (
          <span className={b("note")}>{failed ? "Не удалось открыть изображение" : "Загрузка…"}</span>
        )}
      </div>
      <div className={b("tools")}>
        <div className={b("aspects")}>
          {(frame ? [frame] : ASPECTS).map(([label, a]) => (
            <Chip key={label} label={label} active={aspect === a} onClick={() => pickAspect(a)} />
          ))}
        </div>
        <div className={b("turns")}>
          <button type="button" className={b("turn")} aria-label="Повернуть влево" title="Повернуть влево" onClick={() => turn(-90)}>
            ↺
          </button>
          <button type="button" className={b("turn")} aria-label="Повернуть вправо" title="Повернуть вправо" onClick={() => turn(90)}>
            ↻
          </button>
        </div>
      </div>
    </Drawer>
  );
}
