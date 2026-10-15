import type { MetadataRoute } from "next";

/** Web manifest: name on the home screen, splash and bar colours (paper), icons on paper for any mask. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kuznetsovs Gallery",
    short_name: "Kuznetsovs Gallery",
    start_url: "/",
    display: "standalone",
    background_color: "#f2efe9",
    theme_color: "#f2efe9",
    icons: [
      { src: "/assets/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/assets/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
