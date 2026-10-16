// Map data from the prototype footer (`MAP_LL`, `METRO` in Kuznetsovs Gallery.dc.html). Its own labels for the
// neighbours and the canal are gone: the Yandex scheme names them itself.

export type LngLat = [number, number];

/** The gallery as Yandex Maps places it (organisation 182570160096); 2GIS and Google links keep their own point. */
export const GALLERY_LL: LngLat = [69.319145, 41.335224];
/** The prototype's zoom (MapLibre, 512 px tiles); Yandex counts in 256 px tiles, see `gallery-map.ts`. */
export const GALLERY_ZOOM = 15.9;

/** The gallery's building, filled with accent (OpenStreetMap way 179946379, under the Yandex point). */
export const GALLERY_BUILDING: LngLat[] = [
  [69.3191975, 41.3355996],
  [69.318893, 41.3350475],
  [69.3190945, 41.3349802],
  [69.3191297, 41.3350353],
  [69.31917, 41.3350216],
  [69.3192075, 41.3350867],
  [69.3191672, 41.3351013],
  [69.3193416, 41.3354025],
  [69.3193843, 41.3353922],
  [69.3194254, 41.3354677],
  [69.3193844, 41.3354791],
  [69.3194146, 41.3355329],
  [69.3191975, 41.3355996],
];

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
