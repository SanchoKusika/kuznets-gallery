-- Storage needs SELECT on objects to delete or replace them (the bucket itself stays public for reading by URL).
create policy "Admins list artworks" on storage.objects
  for select to authenticated using (bucket_id = 'artworks' and (select public.is_admin()));
