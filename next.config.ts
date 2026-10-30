import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Keeps the dev badge out of side-by-side comparisons with the prototype.
  devIndicators: false,
  // Bucket images are served as their prepared WebP copies (src/lib/image-loader.ts), not through an optimiser.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
