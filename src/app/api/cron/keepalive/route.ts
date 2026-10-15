import { connection } from "next/server";
import { publicDb } from "@/lib/supabase/public";

/**
 * Daily Vercel Cron (vercel.json): the free Supabase project pauses after a week without requests, and visitors
 * are served cached pages that never reach the database. Reads one public row, so it needs no secret.
 */
export async function GET() {
  // Request time only: a ping must never be answered by a response prerendered at build.
  await connection();
  const { error } = await publicDb().from("products").select("code").limit(1);
  if (error) {
    console.error("keepalive failed", error);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
