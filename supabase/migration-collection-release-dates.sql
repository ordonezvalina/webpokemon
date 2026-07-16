-- Add optional release date columns to the collections table.
-- These columns drive the chronological navigation between collection pages.
alter table public.collections
  add column if not exists release_year integer check (release_year between 1970 and 2100),
  add column if not exists release_month integer check (release_month between 1 and 12);
