// Map data from the prototype footer (`MAP_LL`, `NEAR`, `CANAL`, `METRO` in Kuznetsovs Gallery.dc.html).

export type LngLat = [number, number];

export const GALLERY_LL: LngLat = [69.319611, 41.335306];
export const GALLERY_ZOOM = 15.9;

/** Neighbours shown next to the gallery at zoom ≥ 15.5; `side` is the marker anchor (label left or right of the dot). */
export const NEAR: readonly { n: string; ll: LngLat; side: "left" | "right" }[] = [
  { n: "Har", ll: [69.319482, 41.335862], side: "right" },
  { n: "Ingredi.uz", ll: [69.319367, 41.335592], side: "right" },
  { n: "Mysofa.Uz", ll: [69.320659, 41.335074], side: "left" },
  { n: "Bukva.uz", ll: [69.320451, 41.334804], side: "left" },
  { n: "Grand aluminium service", ll: [69.320113, 41.334669], side: "right" },
  { n: "Gosselin Moving", ll: [69.321011, 41.335792], side: "left" },
  { n: "Bektemir metan", ll: [69.317752, 41.335182], side: "left" },
  { n: "Space Plast", ll: [69.320149, 41.334038], side: "left" },
  { n: "Croissant by D Eco", ll: [69.3247, 41.3349], side: "left" },
];

export const CANAL: { n: string; ll: LngLat } = { n: "канал Салар", ll: [69.317242, 41.335306] };

function geoKm(a: LngLat, b: LngLat) {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLng = (b[0] - a[0]) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

export type Station = { n: string; ll: LngLat; d: string };

/** Metro stations within 2.5 km, nearest first; `d` is the straight-line distance («1,8 км»). */
export const METRO: readonly Station[] = [
  { n: "Пушкин", ll: [69.311244, 41.321708] as LngLat },
  { n: "Машинасозлар", ll: [69.303947, 41.299439] as LngLat },
  { n: "Буюк Ипак Йули", ll: [69.327769, 41.326344] as LngLat },
  { n: "Технопарк", ll: [69.322889, 41.294528] as LngLat },
]
  .map((s) => ({ ...s, km: geoKm(GALLERY_LL, s.ll) }))
  .filter((s) => s.km < 2.5)
  .sort((a, b) => a.km - b.km)
  .map(({ n, ll, km }) => ({ n, ll, d: km.toFixed(1).replace(".", ",") + " км" }));
