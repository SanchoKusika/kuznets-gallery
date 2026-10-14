import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { getCatalog } from "@/lib/catalog";
import s from "./layout.module.scss";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  const total = getCatalog().length;
  return (
    <div className={s.site}>
      <Header total={total} />
      {children}
      <Footer />
    </div>
  );
}
