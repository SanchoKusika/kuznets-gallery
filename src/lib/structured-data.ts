import { CONTACTS, LOCATION } from "@/content/site";
import { GALLERY_LL } from "@/features/map/places";
import type { Artwork } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";

// schema.org data for components/seo/JsonLd: the gallery (home page) and an artwork (work page).

const NAME = "Kuznetsovs Gallery";
const GALLERY_ID = `${SITE_URL}/#gallery`;

/** The site and the gallery as a place: name in results, address, phones, the map point, profiles elsewhere. */
export function galleryData({ description, minPrice }: { description: string; minPrice: number | null }) {
  const [lng, lat] = GALLERY_LL;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: NAME, url: SITE_URL, inLanguage: "ru", publisher: { "@id": GALLERY_ID } },
      {
        "@type": "ArtGallery",
        "@id": GALLERY_ID,
        name: NAME,
        url: SITE_URL,
        description,
        image: `${SITE_URL}/opengraph-image`,
        telephone: CONTACTS.phones.map((p) => p.href.replace("tel:", "")),
        ...(minPrice && { priceRange: `от ${formatPrice(minPrice)}` }),
        address: {
          "@type": "PostalAddress",
          streetAddress: `${LOCATION.title}, ${LOCATION.lines[1].replace(/^У улицы/, "у улицы")}`,
          addressLocality: "Ташкент",
          addressRegion: "Мирзо-Улугбекский район",
          addressCountry: "UZ",
        },
        geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
        sameAs: [CONTACTS.instagram.href, ...LOCATION.navigators.filter((n) => n.n !== "Google Maps").map((n) => n.href)],
      },
    ],
  };
}

/** An artwork as a product: its photos, code, the price range of its sizes in sum. */
export function artworkData(work: Artwork, description: string) {
  const prices = work.sizes.flatMap((s) => (s.p ? [s.p] : []));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: work.title,
    sku: work.code,
    url: SITE_URL + routes.work(work.slug),
    image: [work.flatSrc, work.src].filter(Boolean),
    description,
    brand: { "@type": "Brand", name: NAME },
    ...(prices.length && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "UZS",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: prices.length,
        seller: { "@id": GALLERY_ID },
      },
    }),
  };
}
