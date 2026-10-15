// Supabase client for the scripts, signed in as an admin (ADMIN_LOGIN / ADMIN_PASSWORD from .env.scripts),
// so it writes through the same row level security as the admin panel.

import { createClient } from "@supabase/supabase-js";

export async function adminClient() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ADMIN_LOGIN, ADMIN_PASSWORD } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !ADMIN_LOGIN || !ADMIN_PASSWORD) {
    throw new Error("Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ADMIN_LOGIN and ADMIN_PASSWORD (node --env-file=.env.local --env-file=.env.scripts …)");
  }
  const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: email } = await db.rpc("admin_email", { p_login: ADMIN_LOGIN });
  if (!email) throw new Error(`No admin with login «${ADMIN_LOGIN}»`);
  const { error } = await db.auth.signInWithPassword({ email, password: ADMIN_PASSWORD });
  if (error) throw error;
  return db;
}

/** Throws on a Supabase error, returns data otherwise. */
export function must({ data, error }) {
  if (error) throw error;
  return data;
}
