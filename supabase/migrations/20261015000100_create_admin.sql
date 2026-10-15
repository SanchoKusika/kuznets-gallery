-- Adds an admin panel user. Run it in the Supabase SQL editor (not callable through the API):
--   select public.create_admin('login', 'Имя', 'e-mail', 'password');
create function public.create_admin(p_login text, p_name text, p_email text, p_password text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if char_length(p_password) < 10 then
    raise exception 'password must be at least 10 characters';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(trim(p_email)),
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', lower(trim(p_email)), 'email_verified', true),
    'email', now(), now(), now());

  insert into public.admins (id, login, name) values (v_id, trim(p_login), trim(p_name));
  return v_id;
end $$;

revoke execute on function public.create_admin(text, text, text, text) from public, anon, authenticated;
