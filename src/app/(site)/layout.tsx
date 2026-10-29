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

/** Pictures the meditation mode shows: every n-th work of the catalogue, so that all categories are in. */
const MEDITATION_COUNT = 40;

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();
  const total = catalog.length;
  const step = Math.max(1, Math.floor(total / MEDITATION_COUNT));
  const meditationWorks = catalog
    .filter((_, i) => i % step === 0)
    .slice(0, MEDITATION_COUNT)
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
