-- Price list changes and their undo: new sizes for existing products only (never inserts a row).
-- Runs as the caller, so the admin RLS policy applies.
create function public.set_product_sizes(p_rows jsonb) returns void
language sql set search_path = '' as $$
  update public.products p
  set sizes = x.sizes
  from jsonb_to_recordset(p_rows) as x(code text, sizes jsonb)
  where p.code = x.code
$$;

revoke execute on function public.set_product_sizes(jsonb) from public, anon;
