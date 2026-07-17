-- ============================================================
-- Migration UP: rename volumes -> releases
--
-- Run this file ONLY (do not run the DOWN file unless you want
-- to revert the change).
-- ============================================================

begin;

-- 1. Make sure collections has the description field.
alter table public.collections
  add column if not exists description text;

-- 2. Make sure releases will have a date field.
alter table public.volumes
  add column if not exists release_date date;

-- 3. Move existing collection dates to the first release of each collection.
update public.volumes v
set release_date = make_date(c.release_year, c.release_month, 1)
from public.collections c
where v.collection_id = c.id
  and c.release_year is not null
  and c.release_month is not null
  and v.id = (
    select v2.id
    from public.volumes v2
    where v2.collection_id = c.id
    order by v2.volume asc nulls last, v2.id asc
    limit 1
  );

-- 4. Drop the now-deprecated date columns from collections.
alter table public.collections
  drop column if exists release_year,
  drop column if exists release_month;

-- 5. Rename the table and its columns.
alter table public.volumes rename to releases;
alter table public.releases rename column volume to number;
alter table public.releases rename column name_eng to name;
alter table public.releases
  add column if not exists description text;

-- 6. Rename the foreign-key column in figures.
alter table public.figures rename column volume_id to release_id;

-- 7. Recreate RLS policies with release-oriented names.
alter table public.releases enable row level security;

drop policy if exists "Public read access to volumes" on public.releases;
drop policy if exists "Authenticated users can insert volumes" on public.releases;
drop policy if exists "Authenticated users can update volumes" on public.releases;
drop policy if exists "Authenticated users can delete volumes" on public.releases;

drop policy if exists "Public read access to releases" on public.releases;
create policy "Public read access to releases"
  on public.releases
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can insert releases" on public.releases;
create policy "Authenticated users can insert releases"
  on public.releases
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update releases" on public.releases;
create policy "Authenticated users can update releases"
  on public.releases
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete releases" on public.releases;
create policy "Authenticated users can delete releases"
  on public.releases
  for delete
  to authenticated
  using (true);

commit;
