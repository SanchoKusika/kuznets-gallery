import type { Metadata, Viewport } from "next";
import { LOGO_INTRO_SCRIPT } from "@/components/ui/Logo/logo-intro";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/content/site";
import { MOTION_INIT_SCRIPT } from "@/features/motion/prefers-motion";
import { THEME_INIT_SCRIPT } from "@/features/theme/constants";
import { InlineScript } from "@/features/theme/InlineScript";
import { ThemeSync } from "@/features/theme/ThemeSync";
import { INDEXABLE, SITE_URL } from "@/lib/site-url";
import { onest, piazzolla } from "./fonts";
import "./globals.scss";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Kuznetsovs Gallery",
  },
  description: SITE_DESCRIPTION,
  // Icons and the web manifest are files in app/: favicon.ico, icon.svg, apple-icon.png, manifest.ts.
  appleWebApp: { title: "Kuznetsovs Gallery" },
  // Title and description come from each page; the picture from the nearest opengraph-image.tsx.
  openGraph: { siteName: "Kuznetsovs Gallery", locale: "ru_RU", type: "website" },
  twitter: { card: "summary_large_image" },
  robots: { index: INDEXABLE, follow: INDEXABLE },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${piazzolla.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={`${THEME_INIT_SCRIPT};${MOTION_INIT_SCRIPT};${LOGO_INTRO_SCRIPT}`} />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
