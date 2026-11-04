"use client";

import dynamic from "next/dynamic";
import { useState, type ChangeEvent, type DragEvent } from "react";
import { Thumb } from "@/components/admin/ui/Thumb/Thumb";
import { checkFile, uploadImage } from "@/features/admin/images";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import { imageUrl } from "@/lib/images";
import s from "./ItemThumb.module.scss";

const b = bem(s, "item-thumb");

// The editor and its crop library load only when a picture is opened in it.
const PhotoEditor = dynamic(() => import("@/components/admin/PhotoEditor/PhotoEditor").then((m) => m.PhotoEditor), { ssr: false });

type Props = {
  image: string;
  /** Rendered width for the image loader, e.g. "64px". */
  sizes: string;
  /**
   * A custom print: a picked or dropped file opens in the photo editor and goes up as its picture (WebP with copies).
   * Called as the editor opens, it returns where the uploaded picture goes — the line may have moved by then.
   */
  onUpload?: () => (key: string) => void;
  /** Caption of the photo editor, e.g. the line's title. */
  caption?: string;
  className?: string;
};

/**
 * Picture of a request line. A custom print's one is picked (click) or dropped here and opens in the photo editor
 * first, as in the product card; «✎» on the picture opens the current one.
 */
export function ItemThumb({ image, sizes, onUpload, caption = "Свой принт", className }: Props) {
  const { toast } = useAdmin();
  const [over, setOver] = useState(false);
  // The picture in the editor and where it goes; `n` mounts a fresh editor for every picture.
  const [photo, setPhoto] = useState<{ source: File | string; n: number; open: boolean; done: (key: string) => void } | null>(null);
  if (!onUpload) return <Thumb image={image} sizes={sizes} className={className} />;

  const edit = (source: File | string) => {
    const done = onUpload();
    setPhoto((p) => ({ source, n: (p?.n ?? 0) + 1, open: true, done }));
  };
  const pick = (file: File | undefined) => {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) toast(problem);
    else edit(file);
  };
  const close = () => setPhoto((p) => p && { ...p, open: false });
  const upload = async (file: File) => {
    try {
      photo?.done(await uploadImage(file));
      close();
    } catch {
      toast("Не удалось загрузить изображение — проверьте соединение и попробуйте ещё раз");
    }
  };

  return (
    <>
      <label
        className={b(null, { over }, className)}
        title={image ? "Заменить картинку" : "Загрузить картинку"}
        onDragOver={(e: DragEvent) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.stopPropagation();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          pick(e.dataTransfer.files[0]);
        }}
      >
        <Thumb image={image} sizes={sizes} className={b("img")} />
        <input
          className={b("file")}
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            pick(e.target.files?.[0]);
            e.target.value = ""; // the same file can be picked again
          }}
        />
        {image ? (
          <button
            type="button"
            className={b("edit")}
            aria-label="Редактировать картинку"
            title="Редактировать"
            onClick={(e) => {
              e.preventDefault(); // the label around must not open the file picker
              edit(imageUrl(image));
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
        ) : (
          <svg className={b("plus")} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </label>
      {photo && <PhotoEditor key={photo.n} open={photo.open} source={photo.source} caption={`${caption} · Фото`} onCancel={close} onDone={upload} />}
    </>
  );
}
