-- Flat, straight-on photo of the painting itself (no wall, no perspective) for «Примерьте размер» on the home page.
-- Object key in the `artworks` bucket (`flat/KZ-001.jpg`) or a URL; empty — the work is not offered there.
alter table public.products
  add column flat_image text not null default '' check (char_length(flat_image) <= 500);
