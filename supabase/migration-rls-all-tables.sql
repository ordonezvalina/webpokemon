-- ============================================================
-- Migration: Enable RLS on all previously unrestricted tables
-- Tables: collections, volumes, pokemon, tags, figure_tags
-- Policy: public SELECT for anon + authenticated
--         INSERT / UPDATE / DELETE for authenticated only
-- ============================================================

-- ------------------------------------------------------------
-- collections
-- ------------------------------------------------------------
alter table public.collections enable row level security;

drop policy if exists "Public read access to collections" on public.collections;
create policy "Public read access to collections"
on public.collections
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert collections" on public.collections;
create policy "Authenticated users can insert collections"
on public.collections
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update collections" on public.collections;
create policy "Authenticated users can update collections"
on public.collections
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete collections" on public.collections;
create policy "Authenticated users can delete collections"
on public.collections
for delete
to authenticated
using (true);

-- ------------------------------------------------------------
-- volumes
-- ------------------------------------------------------------
alter table public.volumes enable row level security;

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

-- ------------------------------------------------------------
-- pokemon
-- ------------------------------------------------------------
alter table public.pokemon enable row level security;

drop policy if exists "Public read access to pokemon" on public.pokemon;
create policy "Public read access to pokemon"
on public.pokemon
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert pokemon" on public.pokemon;
create policy "Authenticated users can insert pokemon"
on public.pokemon
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update pokemon" on public.pokemon;
create policy "Authenticated users can update pokemon"
on public.pokemon
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete pokemon" on public.pokemon;
create policy "Authenticated users can delete pokemon"
on public.pokemon
for delete
to authenticated
using (true);

-- ------------------------------------------------------------
-- tags
-- ------------------------------------------------------------
alter table public.tags enable row level security;

drop policy if exists "Public read access to tags" on public.tags;
create policy "Public read access to tags"
on public.tags
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert tags" on public.tags;
create policy "Authenticated users can insert tags"
on public.tags
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update tags" on public.tags;
create policy "Authenticated users can update tags"
on public.tags
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete tags" on public.tags;
create policy "Authenticated users can delete tags"
on public.tags
for delete
to authenticated
using (true);

-- ------------------------------------------------------------
-- figure_tags
-- ------------------------------------------------------------
alter table public.figure_tags enable row level security;

drop policy if exists "Public read access to figure_tags" on public.figure_tags;
create policy "Public read access to figure_tags"
on public.figure_tags
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert figure_tags" on public.figure_tags;
create policy "Authenticated users can insert figure_tags"
on public.figure_tags
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update figure_tags" on public.figure_tags;
create policy "Authenticated users can update figure_tags"
on public.figure_tags
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete figure_tags" on public.figure_tags;
create policy "Authenticated users can delete figure_tags"
on public.figure_tags
for delete
to authenticated
using (true);
