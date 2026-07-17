-- ============================================================
-- Migration DOWN: revert releases -> volumes
--
-- Run this file ONLY if you need to undo the UP migration.
-- ============================================================

begin;

-- 1. Drop release-oriented policies.
drop policy if exists "Public read access to releases" on public.releases;
drop policy if exists "Authenticated users can insert releases" on public.releases;
drop policy if exists "Authenticated users can update releases" on public.releases;
drop policy if exists "Authenticated users can delete releases" on public.releases;

-- 2. Rename figures FK column back.
alter table public.figures rename column release_id to volume_id;

-- 3. Rename releases columns and table back to volume names.
alter table public.releases rename column number to volume;
alter table public.releases rename column name to name_eng;
alter table public.releases rename to volumes;

-- 4. Restore collection date columns.
alter table public.collections
  add column if not exists release_year integer check (release_year between 1970 and 2100),
  add column if not exists release_month integer check (release_month between 1 and 12);

-- 5. Re-derive collection dates from the first volume's release_date.
update public.collections c
set release_year = extract(year from v.release_date)::int,
    release_month = extract(month from v.release_date)::int
from public.volumes v
where v.collection_id = c.id
  and v.release_date is not null
  and v.id = (
    select v2.id
    from public.volumes v2
    where v2.collection_id = c.id
    order by v2.volume asc nulls last, v2.id asc
    limit 1
  );

-- 6. Recreate volume-oriented policies on the restored volumes table.
drop policy if exists "Public read access to volumes" on public.volumes;
create policy "Public read access to volumes"
  on public.volumes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can insert volumes" on public.volumes;
create policy "Authenticated users can insert volumes"
  on public.volumes
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update volumes" on public.volumes;
create policy "Authenticated users can update volumes"
  on public.volumes
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete volumes" on public.volumes;
create policy "Authenticated users can delete volumes"
  on public.volumes
  for delete
  to authenticated
  using (true);

commit;
