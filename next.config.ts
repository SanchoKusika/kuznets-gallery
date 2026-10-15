import path from "node:path";
import type { NextConfig } from "next";
import { IMAGE_BASE } from "./src/lib/images";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Keeps the dev badge out of side-by-side comparisons with the prototype.
  devIndicators: false,
  images: {
    remotePatterns: [new URL(IMAGE_BASE + "**")],
    qualities: [75],
  },
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
  experimental: {
    // On Cloudflare Workers zlib rejects the 500 MB inflate limit Next passes when resuming a PPR page
    // (RangeError, then the request hangs): keep the resume data uncompressed.
    disableResumeDataCacheCompression: true,
  },
};

export default nextConfig;
