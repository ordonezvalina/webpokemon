create extension if not exists "pgcrypto";

create table if not exists public.figuras (
  id uuid primary key default gen_random_uuid(),
  id_inventario text not null unique,
  num_pokedex integer not null,
  nombre text not null,
  generacion integer not null check (generacion between 1 and 9),
  linea text not null default 'tomy-arts' check (linea in ('moncolle', 'tomy-arts')),
  atributos text[] not null default '{}',
  variante text not null default 'Normal',
  detalles text,
  anio integer check (anio is null or anio between 1970 and 2100),
  mfc_id text,
  foto_url text,
  fotos_urls text[] default '{}',
  creado_en timestamp with time zone not null default now()
);

alter table public.figuras
add column if not exists linea text not null default 'tomy-arts';

alter table public.figuras
add column if not exists atributos text[] not null default '{}';

create index if not exists figuras_generacion_idx on public.figuras (generacion);
create index if not exists figuras_linea_idx on public.figuras (linea);
create index if not exists figuras_atributos_idx on public.figuras using gin (atributos);
create index if not exists figuras_num_pokedex_idx on public.figuras (num_pokedex);
create index if not exists figuras_nombre_idx on public.figuras (nombre);

alter table public.figuras enable row level security;

drop policy if exists "Lectura publica de figuras" on public.figuras;
create policy "Lectura publica de figuras"
on public.figuras
for select
to anon, authenticated
using (true);

drop policy if exists "Usuarios autenticados pueden insertar figuras" on public.figuras;
create policy "Usuarios autenticados pueden insertar figuras"
on public.figuras
for insert
to authenticated
with check (true);

drop policy if exists "Usuarios autenticados pueden actualizar figuras" on public.figuras;
create policy "Usuarios autenticados pueden actualizar figuras"
on public.figuras
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Usuarios autenticados pueden borrar figuras" on public.figuras;
create policy "Usuarios autenticados pueden borrar figuras"
on public.figuras
for delete
to authenticated
using (true);

-- ------------------------------------------------------------
-- Canonical line values + CHECK constraint
-- (see also: migration-line-constraint.sql)
-- Canonical values MUST match figureTaxonomy.js → LINES
-- ------------------------------------------------------------
update public.figures set line = 'tomy'   where line = 'moncolle';
update public.figures set line = 't_arts' where line in ('tomy-arts', 'tomy_arts');

alter table public.figures
  drop constraint if exists figures_line_check;

alter table public.figures
  add constraint figures_line_check
  check (line in ('tomy', 't_arts'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-figuras',
  'fotos-figuras',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Lectura publica de fotos" on storage.objects;
create policy "Lectura publica de fotos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'fotos-figuras');

drop policy if exists "Usuarios autenticados pueden subir fotos" on storage.objects;
create policy "Usuarios autenticados pueden subir fotos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'fotos-figuras');

drop policy if exists "Usuarios autenticados pueden actualizar fotos" on storage.objects;
create policy "Usuarios autenticados pueden actualizar fotos"
on storage.objects
for update
to authenticated
using (bucket_id = 'fotos-figuras')
with check (bucket_id = 'fotos-figuras');

drop policy if exists "Usuarios autenticados pueden borrar fotos" on storage.objects;
create policy "Usuarios autenticados pueden borrar fotos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'fotos-figuras');

-- ------------------------------------------------------------
-- RLS: collections
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
-- RLS: volumes
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
-- RLS: pokemon
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
-- RLS: tags
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
-- RLS: figure_tags
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
