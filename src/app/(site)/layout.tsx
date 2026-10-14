import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { OrderDrawer } from "@/features/order/OrderDrawer";
import { getCatalog } from "@/lib/catalog";
import { bem } from "@/lib/bem";
import s from "./layout.module.scss";

const b = bem(s, "site");

export default function SiteLayout({ children }: LayoutProps<"/">) {
  const total = getCatalog().length;
  return (
    <div className={b()}>
      <Header total={total} />
      {children}
      <Footer />
      <OrderDrawer />
    </div>
  );
}
