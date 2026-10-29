import { Footer } from "@/components/layout/Footer/Footer";
import { AdminBadge } from "@/components/layout/AdminBadge/AdminBadge";
import { Header } from "@/components/layout/Header/Header";
import { Meditation } from "@/features/meditation/Meditation";
import { Cursor } from "@/features/motion/Cursor";
import { Reveal } from "@/features/motion/Reveal";
import { OrderDrawer } from "@/features/order/OrderDrawer";
import { NavigationScroll } from "@/features/scroll/NavigationScroll";
import { SmoothScroll } from "@/features/scroll/SmoothScroll";
import { SiteQuirks } from "@/features/whimsy/SiteQuirks";
import { getCatalog } from "@/lib/catalog";
import { bem } from "@/lib/bem";
import { routes } from "@/lib/routes";
import s from "./layout.module.scss";

const b = bem(s, "site");

/** Pictures the meditation mode shows: works spread evenly over the whole catalogue, so that all categories are in. */
const MEDITATION_COUNT = 40;

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();
  const total = catalog.length;
  const count = Math.min(MEDITATION_COUNT, total);
  const meditationWorks = Array.from({ length: count }, (_, j) => catalog[Math.floor((j * total) / count)])
    .map((p) => ({ src: p.src, href: routes.work(p.slug) }));
  return (
    <div className={b()}>
      <Header total={total} />
      {children}
      <NavigationScroll />
      <Footer />
      <OrderDrawer />
      <AdminBadge />
      <Cursor />
      <Reveal />
      <SmoothScroll />
      <SiteQuirks />
      <Meditation works={meditationWorks} />
    </div>
  );
}
