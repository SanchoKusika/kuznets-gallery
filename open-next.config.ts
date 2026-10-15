import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Pages are served as prerendered at build time (from the Worker's static assets) and never regenerated:
// OpenNext does not support Cache Components yet — a runtime re-render after updateTag hangs the Worker
// (opennextjs-cloudflare #1450, #1318). Admin edits reach the site with the next deploy. Once that is fixed,
// switch to the R2 incremental cache + D1 tag cache + DO queue for live updates.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
