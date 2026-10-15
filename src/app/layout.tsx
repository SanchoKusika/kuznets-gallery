import type { Metadata, Viewport } from "next";
import { MOTION_INIT_SCRIPT } from "@/features/motion/prefers-motion";
import { THEME_INIT_SCRIPT } from "@/features/theme/constants";
import { InlineScript } from "@/features/theme/InlineScript";
import { ThemeSync } from "@/features/theme/ThemeSync";
import { SITE_URL } from "@/lib/site-url";
import { onest, piazzolla } from "./fonts";
import "./globals.scss";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kuznetsovs Gallery — принт-картины в Ташкенте",
    template: "%s — Kuznetsovs Gallery",
  },
  description:
    "Принт-картины, объединяющие традиционное и современное. В наличии и на заказ, от 90 000 сум, изготовление 3–7 дней, доставка по Узбекистану.",
  // Icons and the web manifest are files in app/: favicon.ico, icon.svg, apple-icon.png, manifest.ts.
  appleWebApp: { title: "Kuznetsovs Gallery" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${piazzolla.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={`${THEME_INIT_SCRIPT};${MOTION_INIT_SCRIPT}`} />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
