import type { CookieOptions } from "@supabase/ssr";

/** "0" when the admin signed in without «Запомнить это устройство»: auth cookies then live until the browser closes. */
export const REMEMBER_COOKIE = "kz_admin_remember";

/** Auth cookies are httpOnly: only the server reads the session. */
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

/** Drops the lifetime of auth cookies for a session-only sign-in (deletions keep maxAge 0). */
export function withLifetime(options: CookieOptions, remember: boolean): CookieOptions {
  if (remember || options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
