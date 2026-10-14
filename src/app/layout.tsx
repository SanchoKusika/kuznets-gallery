import type { Metadata, Viewport } from "next";
import { THEME_INIT_SCRIPT } from "@/features/theme/constants";
import { ThemeSync } from "@/features/theme/ThemeSync";
import { onest, piazzolla } from "./fonts";
import "./globals.scss";

export const metadata: Metadata = {
  title: {
    default: "Kuznetsovs Gallery — принт-картины в Ташкенте",
    template: "%s — Kuznetsovs Gallery",
  },
  description:
    "Принт-картины, объединяющие традиционное и современное. В наличии и на заказ, от 90 000 сум, изготовление 3–7 дней, доставка по Узбекистану.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${piazzolla.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
