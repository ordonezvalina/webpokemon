-- ============================================================
-- Migration: Backfill missing figure slugs
-- ============================================================
-- Run this in the Supabase Dashboard › SQL Editor.
-- This script is idempotent: safe to execute multiple times.
--
-- It mirrors the panel logic in src/pages/panel-secreto.astro:
--   base = <pokemon.id>-<line>
--   then append (in this order): -clear, -shiny, -pearl
--   finally append a numeric suffix to avoid duplicates.
--
-- pokemon.id is the PokéAPI name slug (e.g. 'chikorita'), not the UUID.
-- ============================================================

CREATE OR REPLACE FUNCTION public.backfill_figure_slugs()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    rec record;
    base_slug text;
    candidate text;
    n integer;
BEGIN
    FOR rec IN
        SELECT
            f.id AS figure_id,
            p.id AS pokemon_id,
            f.line,
            COALESCE(f.is_clear, false) AS is_clear,
            COALESCE(f.is_shiny, false) AS is_shiny,
            COALESCE(f.is_pearl, false) AS is_pearl
        FROM public.figures f
        JOIN public.pokemon p ON p.id = f.pokemon_id
        WHERE f.slug IS NULL OR f.slug = ''
        ORDER BY f.created_at ASC NULLS LAST, f.id ASC
    LOOP
        -- Build the base slug in the same order as the panel code
        base_slug := lower(rec.pokemon_id || '-' || rec.line);
        IF rec.is_clear THEN base_slug := base_slug || '-clear'; END IF;
        IF rec.is_shiny THEN base_slug := base_slug || '-shiny'; END IF;
        IF rec.is_pearl THEN base_slug := base_slug || '-pearl'; END IF;

        -- Find the first available slug: base_slug, base_slug-2, base_slug-3, ...
        candidate := base_slug;
        n := 2;
        LOOP
            PERFORM 1
            FROM public.figures
            WHERE slug = candidate AND id <> rec.figure_id;

            EXIT WHEN NOT FOUND;

            candidate := base_slug || '-' || n;
            n := n + 1;
        END LOOP;

        UPDATE public.figures
        SET slug = candidate
        WHERE id = rec.figure_id;
    END LOOP;
END;
$$;

-- Execute the backfill
SELECT public.backfill_figure_slugs();

-- Optional: verify how many slugs were filled
-- SELECT count(*) AS missing_slugs FROM public.figures WHERE slug IS NULL OR slug = '';

-- Optional: drop the helper function once you are done
-- DROP FUNCTION IF EXISTS public.backfill_figure_slugs();
