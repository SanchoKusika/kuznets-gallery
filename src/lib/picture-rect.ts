/** Where the picture itself is drawn inside an <img> (object-fit: contain leaves margins). */
export function pictureRect(img: HTMLImageElement) {
  const box = img.getBoundingClientRect();
  const { objectFit, objectPosition } = getComputedStyle(img);
  if (objectFit !== "contain" || !img.naturalWidth) return box;
  const k = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  const [px, py] = objectPosition.split(" ").map((v) => parseFloat(v) / 100);
  return new DOMRect(box.left + (box.width - w) * px, box.top + (box.height - h) * py, w, h);
}
