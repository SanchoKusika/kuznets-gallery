import { Footer } from "@/components/layout/Footer/Footer";
import { AdminBadge } from "@/components/layout/AdminBadge/AdminBadge";
import { Header } from "@/components/layout/Header/Header";
import { Cursor } from "@/features/motion/Cursor";
import { Reveal } from "@/features/motion/Reveal";
import { OrderDrawer } from "@/features/order/OrderDrawer";
import { NavigationScroll } from "@/features/scroll/NavigationScroll";
import { SmoothScroll } from "@/features/scroll/SmoothScroll";
import { SiteQuirks } from "@/features/whimsy/SiteQuirks";
import { getCatalog } from "@/lib/catalog";
import { bem } from "@/lib/bem";
import s from "./layout.module.scss";

const b = bem(s, "site");

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const total = (await getCatalog()).length;
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
    </div>
  );
}
