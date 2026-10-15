import { cookies } from "next/headers";
import { getAdmin } from "@/features/admin/server";
import { ADMIN_MARKER_COOKIE } from "@/lib/supabase/cookies";

/**
 * The site's admin badge: number of new requests for a signed-in admin.
 * Without a valid session the marker cookie is dropped, so the site stops asking.
 */
export async function GET() {
  const session = await getAdmin();
  if (!session) {
    (await cookies()).delete(ADMIN_MARKER_COOKIE);
    return Response.json({ ok: false }, { status: 401 });
  }
  const { count, error } = await session.db.from("requests").select("id", { count: "exact", head: true }).eq("status", "new");
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, fresh: count ?? 0 }, { headers: { "Cache-Control": "private, no-store" } });
}
