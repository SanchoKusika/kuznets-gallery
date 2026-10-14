import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Keeps the dev badge out of side-by-side comparisons with the prototype.
  devIndicators: false,
  images: {
    remotePatterns: [new URL("https://kuznets.uz/wp-content/uploads/**")],
    qualities: [75],
  },
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
