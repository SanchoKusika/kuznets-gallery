-- is_admin() is only needed by signed-in users (RLS policies of the admin panel).
revoke execute on function public.is_admin() from public, anon;
