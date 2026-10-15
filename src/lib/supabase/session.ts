import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_COOKIE_OPTIONS, REMEMBER_COOKIE, withLifetime } from "./cookies";
import { supabaseEnv } from "./public";
import type { Database } from "./types";

/**
 * Client acting as the signed-in admin (cookie session). In Server Components cookies can't be written —
 * the proxy refreshes the session for /admin before rendering; Server Actions write them.
 */
export async function sessionDb(remember?: boolean) {
  const store = await cookies();
  const keep = remember ?? store.get(REMEMBER_COOKIE)?.value !== "0";
  const { url, key } = supabaseEnv();
  return createServerClient<Database>(url, key, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, withLifetime(options, keep));
        } catch {
          // Called from a Server Component: the proxy has already refreshed the session.
        }
      },
    },
  });
}
