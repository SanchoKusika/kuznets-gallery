-- Kuznets Gallery: catalogue, requests (заявки), reviews, admins, artwork storage.
-- Models follow design/README.md («Модели данных»).

create type public.request_status as enum ('new', 'contact', 'mockup', 'prod', 'ship', 'done', 'cancel');
create type public.request_source as enum ('Сайт', 'Instagram', 'Telegram', 'Телефон');

-- Catalogue. `image` is an object key in the `artworks` bucket (or an absolute URL);
-- `sizes` is [{ w, h, price | null }]; `categories` keeps the catalogue's service tag `all`.
create table public.products (
  code text primary key check (code ~ '^KZ-[0-9]{3,}$'),
  title text not null default '' check (char_length(title) <= 200),
  description text not null default '' check (char_length(description) <= 2000),
  image text not null default '' check (char_length(image) <= 500),
  sizes jsonb not null default '[]' check (jsonb_typeof(sizes) = 'array'),
  custom_sizes text[] not null default '{}',
  categories text[] not null default '{}' check (categories <@ array['home', 'kids', 'office', 'public', 'all']),
  hidden boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_sort_idx on public.products (sort_order, code);

-- Requests. Numbers continue the prototype's (its demo archive ends at № 1048).
-- `items` is a snapshot [{ code, title, image, w, h, price, frame, qty }], `notes` is [{ at, text }].
create sequence public.request_no_seq start 1049;
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  no integer not null unique default nextval('public.request_no_seq'),
  created_at timestamptz not null default now(),
  name text not null default '' check (char_length(name) <= 100),
  phone text not null default '' check (char_length(phone) <= 40),
  company text not null default '' check (char_length(company) <= 200),
  source public.request_source not null default 'Сайт',
  status public.request_status not null default 'new',
  comment text not null default '' check (char_length(comment) <= 2000),
  due date,
  notes jsonb not null default '[]' check (jsonb_typeof(notes) = 'array'),
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now()
);
alter sequence public.request_no_seq owned by public.requests.no;
create index requests_created_idx on public.requests (created_at desc);
create index requests_status_idx on public.requests (status);

-- Reviews; `sort_order` is the order of the slider on the home page.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null default '' check (char_length(name) <= 100),
  text text not null default '' check (char_length(text) <= 1000),
  hidden boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index reviews_sort_idx on public.reviews (sort_order);

-- Admin panel users (one role). Sign-in goes through Supabase Auth; `login` is what they type.
create table public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  login text not null check (char_length(login) between 1 and 100),
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);
create unique index admins_login_idx on public.admins (lower(login));

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger requests_touch before update on public.requests
  for each row execute function public.touch_updated_at();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where id = (select auth.uid()))
$$;

-- Row level security: the site reads with the publishable key (anon), the admin panel with the admin's session.
alter table public.products enable row level security;
alter table public.requests enable row level security;
alter table public.reviews enable row level security;
alter table public.admins enable row level security;

create policy "Site reads visible products" on public.products
  for select to anon using (not hidden);
create policy "Admins manage products" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Site reads visible reviews" on public.reviews
  for select to anon using (not hidden);
create policy "Admins manage reviews" on public.reviews
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage requests" on public.requests
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins read themselves" on public.admins
  for select to authenticated using (id = (select auth.uid()));

-- A request from the site drawer (prototype `saveRequest`: status «new», source «Сайт»).
-- The only way anon can write; limits: 3 per phone per 10 minutes, 30 per minute overall.
create function public.submit_request(p_name text, p_phone text, p_comment text, p_items jsonb)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_no integer;
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 100
    or char_length(v_digits) < 9 or char_length(p_phone) > 40
    or char_length(coalesce(p_comment, '')) > 2000
    or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 50
    or pg_column_size(p_items) > 65536 then
    raise exception 'invalid_request' using errcode = '22023';
  end if;

  if (select count(*) from public.requests
        where created_at > now() - interval '10 minutes'
          and regexp_replace(phone, '\D', '', 'g') = v_digits) >= 3
    or (select count(*) from public.requests where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.requests (name, phone, comment, items, source, status)
  values (trim(p_name), trim(p_phone), trim(coalesce(p_comment, '')), p_items, 'Сайт', 'new')
  returning no into v_no;
  return v_no;
end $$;

-- Login form accepts the admin's login (or e-mail); Supabase Auth signs in by e-mail.
create function public.admin_email(p_login text) returns text
language sql stable security definer set search_path = '' as $$
  select u.email::text
  from public.admins a join auth.users u on u.id = a.id
  where lower(a.login) = lower(trim(p_login)) or lower(u.email) = lower(trim(p_login))
  limit 1
$$;

revoke execute on function public.submit_request(text, text, text, jsonb) from public, authenticated;
revoke execute on function public.admin_email(text) from public, authenticated;
grant execute on function public.submit_request(text, text, text, jsonb) to anon;
grant execute on function public.admin_email(text) to anon;

-- Artwork images: public bucket, admins upload and replace.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artworks', 'artworks', true, 15728640, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Admins upload artworks" on storage.objects
  for insert to authenticated with check (bucket_id = 'artworks' and (select public.is_admin()));
create policy "Admins update artworks" on storage.objects
  for update to authenticated using (bucket_id = 'artworks' and (select public.is_admin()));
create policy "Admins delete artworks" on storage.objects
  for delete to authenticated using (bucket_id = 'artworks' and (select public.is_admin()));
