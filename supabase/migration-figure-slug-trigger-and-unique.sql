-- ============================================================
-- Migration: Auto-generate figure slugs and enforce uniqueness
-- ============================================================
-- Run this in the Supabase Dashboard › SQL Editor.
-- Idempotent: safe to execute multiple times.
--
-- This migration:
--   1. Creates a trigger that auto-fills empty slugs on INSERT/UPDATE.
--   2. Backfills any existing rows with a missing slug.
--   3. Deduplicates any existing slug collisions.
--   4. Adds a unique index and a non-empty CHECK constraint.
-- ============================================================

-- ------------------------------------------------------------
-- Step 1: Trigger function to auto-generate slugs
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ensure_figure_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    pokemon_slug text;
    base_slug text;
    candidate text;
    n integer;
BEGIN
    -- Never overwrite an existing slug on UPDATE so public URLs stay stable.
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        RETURN NEW;
    END IF;

    SELECT p.id INTO pokemon_slug
    FROM public.pokemon p
    WHERE p.id = NEW.pokemon_id;

    -- Fallback if the pokemon reference is missing (shouldn't happen).
    IF pokemon_slug IS NULL THEN
        NEW.slug := lower(replace(NEW.id::text, '-', ''));
        RETURN NEW;
    END IF;

    -- Mirror the panel slug format: <pokemon.id>-<line>[-clear][-shiny][-pearl]
    base_slug := lower(pokemon_slug || '-' || NEW.line);
    IF COALESCE(NEW.is_clear, false) THEN base_slug := base_slug || '-clear'; END IF;
    IF COALESCE(NEW.is_shiny, false) THEN base_slug := base_slug || '-shiny'; END IF;
    IF COALESCE(NEW.is_pearl, false) THEN base_slug := base_slug || '-pearl'; END IF;

    -- Find the first available variant: base_slug, base_slug-2, base_slug-3, ...
    candidate := base_slug;
    n := 2;
    LOOP
        PERFORM 1
        FROM public.figures
        WHERE slug = candidate
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

        EXIT WHEN NOT FOUND;

        candidate := base_slug || '-' || n;
        n := n + 1;
    END LOOP;

    NEW.slug := candidate;
    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- Step 2: Attach trigger
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS figures_ensure_slug ON public.figures;

CREATE TRIGGER figures_ensure_slug
BEFORE INSERT OR UPDATE ON public.figures
FOR EACH ROW
EXECUTE FUNCTION public.ensure_figure_slug();

-- ------------------------------------------------------------
-- Step 3: Backfill any rows that currently lack a slug
-- ------------------------------------------------------------

UPDATE public.figures
SET slug = NULL
WHERE slug IS NULL OR slug = '';

-- ------------------------------------------------------------
-- Step 4: Deduplicate existing slugs
-- ------------------------------------------------------------

DO $$
DECLARE
    rec record;
    candidate text;
    n integer;
BEGIN
    FOR rec IN
        SELECT f.id, f.slug AS old_slug
        FROM public.figures f
        WHERE f.slug IN (
            SELECT slug
            FROM public.figures
            WHERE slug IS NOT NULL AND slug <> ''
            GROUP BY slug
            HAVING count(*) > 1
        )
        AND f.id::text NOT IN (
            SELECT min(id::text)
            FROM public.figures
            WHERE slug IS NOT NULL AND slug <> ''
            GROUP BY slug
            HAVING count(*) > 1
        )
        ORDER BY f.created_at ASC NULLS LAST, f.id ASC
    LOOP
        candidate := rec.old_slug || '-2';
        n := 3;
        LOOP
            PERFORM 1
            FROM public.figures
            WHERE slug = candidate AND id <> rec.id;

            EXIT WHEN NOT FOUND;

            candidate := rec.old_slug || '-' || n;
            n := n + 1;
        END LOOP;

        UPDATE public.figures
        SET slug = candidate
        WHERE id = rec.id;
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Step 5: Enforce uniqueness and non-emptiness
-- ------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS figures_slug_unique_idx
ON public.figures (slug);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'figures_slug_not_empty'
          AND conrelid = 'public.figures'::regclass
    ) THEN
        ALTER TABLE public.figures
        ADD CONSTRAINT figures_slug_not_empty
        CHECK (slug IS NOT NULL AND slug <> '');
    END IF;
END $$;

-- ------------------------------------------------------------
-- Verification (optional — run manually to confirm)
-- ------------------------------------------------------------
-- SELECT count(*) AS missing_slugs FROM public.figures WHERE slug IS NULL OR slug = '';
-- SELECT slug, count(*) FROM public.figures GROUP BY slug HAVING count(*) > 1;
