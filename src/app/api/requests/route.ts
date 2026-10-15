import { z } from "zod";
import { isPhoneValid, type RequestPayload } from "@/lib/request";
import { publicDb } from "@/lib/supabase/public";

const Item = z.object({
  code: z.string().max(20),
  title: z.string().max(200),
  image: z.string().max(500),
  w: z.number().int().positive().nullable(),
  h: z.number().int().positive().nullable(),
  price: z.number().int().nonnegative().nullable(),
  frame: z.string().max(100),
  qty: z.number().int().min(1).max(99),
});

const RequestBody = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).refine(isPhoneValid),
  comment: z.string().trim().max(2000),
  items: z.array(Item).max(50),
}) satisfies z.ZodType<RequestPayload>;

/**
 * New request from the site drawer (prototype `saveRequest`: status "new", source "Сайт").
 * Stored by the `submit_request` database function, which also rate-limits (3 per phone per 10 minutes).
 */
export async function POST(req: Request) {
  const parsed = RequestBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const { name, phone, comment, items } = parsed.data;
  const { data: no, error } = await publicDb().rpc("submit_request", { p_name: name, p_phone: phone, p_comment: comment, p_items: items });
  if (error) {
    const limited = error.message === "rate_limited";
    if (!limited) console.error("submit_request failed", error);
    return Response.json({ ok: false, error: limited ? "rate_limited" : "failed" }, { status: limited ? 429 : 500 });
  }
  return Response.json({ ok: true, no }, { status: 201 });
}
