-- Ejecutar en Supabase SQL Editor.

alter table public.figuras
add column if not exists anio integer check (anio is null or anio between 1970 and 2100);

alter table public.figuras
add column if not exists mfc_id text;
