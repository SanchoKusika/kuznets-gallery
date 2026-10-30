import { CONTACTS, FAQ, HOURS, LOCATION } from "@/content/site";
import { GALLERY_LL } from "@/features/map/places";
import type { Artwork } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";

// schema.org data for components/seo/JsonLd: the gallery (home page), an artwork (work page), the path to a page
// (breadcrumbs) and the questions and answers («Покупателям»).

const NAME = "Kuznetsovs Gallery";
const GALLERY_ID = `${SITE_URL}/#gallery`;

/** The site and the gallery as a place: name in results, address, phones, hours, the map point, profiles elsewhere. */
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
          streetAddress: LOCATION.street,
          addressLocality: "Ташкент",
          addressRegion: "Мирзо-Улугбекский район",
          addressCountry: "UZ",
        },
        geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
        openingHoursSpecification: { "@type": "OpeningHoursSpecification", ...HOURS.schema },
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

/** First steps of every path. */
export const HOME_STEP = { name: "Главная", path: routes.home };
export const COLLECTION_STEP = { name: "Коллекция", path: routes.collection() };

/** The path to a page from the home page, its last step the page itself. */
export function breadcrumbData(steps: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, i) => ({ "@type": "ListItem", position: i + 1, name: step.name, item: SITE_URL + step.path })),
  };
}

/** The frequent questions as on the page (components/sections/Faq); marked up once, on «Покупателям». */
export function faqData() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
