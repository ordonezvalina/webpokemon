-- Ejecutar en Supabase SQL Editor para añadir soporte de hasta 4 fotos por figura.

alter table public.figuras
add column if not exists fotos_urls text[] default '{}';

-- Migrar fotos existentes al nuevo campo.
update public.figuras
set fotos_urls = array[foto_url]
where foto_url is not null
  and (fotos_urls is null or fotos_urls = '{}');
