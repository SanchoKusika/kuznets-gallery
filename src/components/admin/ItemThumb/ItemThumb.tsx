"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { Thumb } from "@/components/admin/ui/Thumb/Thumb";
import { checkFile, uploadImage } from "@/features/admin/images";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./ItemThumb.module.scss";

const b = bem(s, "item-thumb");

type Props = {
  image: string;
  /** Rendered width for the image loader, e.g. "64px". */
  sizes: string;
  /**
   * A custom print: a picked or dropped file goes up as its picture (WebP with copies). Called as the upload starts,
   * it returns where the uploaded picture goes — the line may have moved by then.
   */
  onUpload?: () => (key: string) => void;
  className?: string;
};

/** Picture of a request line; a custom print's one is picked, dropped or replaced right here. */
export function ItemThumb({ image, sizes, onUpload, className }: Props) {
  const { toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  if (!onUpload) return <Thumb image={image} sizes={sizes} className={className} />;

  const take = async (file: File | undefined) => {
    if (!file || busy) return;
    const problem = checkFile(file);
    if (problem) return toast(problem);
    setBusy(true);
    const done = onUpload();
    try {
      done(await uploadImage(file));
    } catch {
      toast("Не удалось загрузить изображение — проверьте соединение и попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      className={b(null, { busy, over }, className)}
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
        void take(e.dataTransfer.files[0]);
      }}
    >
      <Thumb image={image} sizes={sizes} className={b("img")} />
      <input
        className={b("file")}
        type="file"
        accept="image/*"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          void take(e.target.files?.[0]);
          e.target.value = ""; // the same file can be picked again
        }}
      />
      <span className={b("hint")}>{busy ? "…" : image ? "" : "+"}</span>
    </label>
  );
}
