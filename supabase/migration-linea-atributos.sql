-- Ejecutar en Supabase SQL Editor.
-- Migra de variante (texto) a linea + atributos (text[]).

alter table public.figuras
add column if not exists atributos text[] not null default '{}';

alter table public.figuras
alter column linea set default 'tomy-arts';

update public.figuras
set linea = case
  when lower(trim(linea)) in ('moncolle') then 'moncolle'
  when lower(replace(trim(linea), ' ', '-')) in ('tomy-arts', 'tomyarts') then 'tomy-arts'
  else 'moncolle'
end;

update public.figuras
set atributos = (
  select coalesce(array_agg(distinct mapped order by mapped), '{}')
  from (
    select case lower(trim(token))
      when 'clear' then 'clear'
      when 'pearl' then 'brillante'
      when 'brillante' then 'brillante'
      when 'shiny' then 'shiny'
      when 'mega' then 'mega'
      when 'con base' then 'con-base'
      when 'con-base' then 'con-base'
      else null
    end as mapped
    from unnest(string_to_array(coalesce(variante, ''), ',')) as token
    where trim(token) <> '' and lower(trim(token)) <> 'normal'
  ) as tokens
  where mapped is not null
)
where (atributos is null or atributos = '{}')
  and coalesce(variante, '') <> ''
  and lower(trim(variante)) <> 'normal';

alter table public.figuras
drop constraint if exists figuras_linea_check;

alter table public.figuras
add constraint figuras_linea_check
check (linea in ('moncolle', 'tomy-arts'));

create index if not exists figuras_linea_idx on public.figuras (linea);
create index if not exists figuras_atributos_idx on public.figuras using gin (atributos);
