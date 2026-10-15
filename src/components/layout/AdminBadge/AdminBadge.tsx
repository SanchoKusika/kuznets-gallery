"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { bem } from "@/lib/bem";
import { routes } from "@/lib/routes";
import { ADMIN_MARKER_COOKIE } from "@/lib/supabase/cookies";
import s from "./AdminBadge.module.scss";

const b = bem(s, "admin-badge");

const signedIn = () => document.cookie.split("; ").includes(`${ADMIN_MARKER_COOKIE}=1`);

/**
 * Admin badge on the site (prototype `adminOn`): fixed bottom-left ink pill «Админка ● N новых»,
 * plus «Редактировать KZ-xxx» on an artwork page. Shown only to a signed-in admin.
 */
export function AdminBadge() {
  const pathname = usePathname();
  const [fresh, setFresh] = useState<number | null>(null);

  // Ask the server only when the admin marker is set; refresh when the tab comes back.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!signedIn()) return;
      try {
        const res = await fetch("/api/admin/badge", { cache: "no-store" });
        const data = res.ok ? await res.json() : null;
        if (alive) setFresh(data?.ok ? data.fresh : null);
      } catch {
        // Offline: keep the last state.
      }
    };
    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (fresh == null) return null;
  const code = pathname.match(/^\/work\/(kz-\d+)$/i)?.[1].toUpperCase();

  return (
    <div className={b()}>
      <Link href={routes.admin} prefetch={false} className={b("link")}>
        <span>Админка</span>
        {fresh > 0 && (
          <span className={b("new")}>
            <span className={b("dot")} />
            {fresh}
          </span>
        )}
      </Link>
      {code && (
        <Link href={`${routes.admin}?edit=${code}`} prefetch={false} className={b("link")}>
          Редактировать<span className={b("code")}>{code}</span>
        </Link>
      )}
    </div>
  );
}
