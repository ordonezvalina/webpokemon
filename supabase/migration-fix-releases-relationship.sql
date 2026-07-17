-- ============================================================
-- Fix: ensure the figures -> releases FK relationship exists
-- and force PostgREST to refresh its schema cache.
--
-- Run this in Supabase Dashboard → SQL Editor if the build fails
-- with: "Could not find a relationship between 'figures' and 'releases'"
-- ============================================================

-- 1. Rename the FK column if the migration left it as volume_id.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'figures'
      and column_name = 'volume_id'
  ) then
    alter table public.figures rename column volume_id to release_id;
  end if;
end $$;

-- 2. Create the FK from figures.release_id -> releases.id if it is missing.
--    This is safe because the app expects the nested relationship.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.figures'::regclass
      and confrelid = 'public.releases'::regclass
  ) then
    alter table public.figures
      add constraint figures_release_id_fkey
      foreign key (release_id) references public.releases(id);
  end if;
end $$;

-- 3. Tell PostgREST to reload its schema cache so the relationship is visible.
select pg_notify('pgrst', 'reload schema');
