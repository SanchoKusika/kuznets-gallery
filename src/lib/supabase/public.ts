import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/** Project URL and publishable key; both are server-only env vars (the browser never talks to Supabase). */
export function supabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set");
  return { url, key };
}

/**
 * Anonymous client: the visible catalogue, reviews and new requests from the site (see the RLS policies).
 * No cookies, so it can run inside `'use cache'`.
 */
export function publicDb() {
  const { url, key } = supabaseEnv();
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
