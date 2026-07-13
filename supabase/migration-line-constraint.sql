-- ============================================================
-- Migration: Normalise figures.line to canonical values
--            and enforce a CHECK constraint
-- ============================================================
-- Run this in the Supabase Dashboard › SQL Editor.
-- This script is idempotent: safe to execute multiple times.
--
-- Canonical values (must match figureTaxonomy.js → LINES):
--   'tomy'   → Takara Tomy / Moncolle
--   't_arts' → Takara Tomy Arts (T-Arts)
-- ============================================================


-- ------------------------------------------------------------
-- Step 1: Normalise legacy data to canonical values
-- ------------------------------------------------------------

-- 'moncolle' was used in early schema versions
UPDATE public.figures
SET line = 'tomy'
WHERE line = 'moncolle';

-- 'tomy-arts' and 'tomy_arts' were used before standardisation
UPDATE public.figures
SET line = 't_arts'
WHERE line IN ('tomy-arts', 'tomy_arts');


-- ------------------------------------------------------------
-- Step 2: Add CHECK constraint (idempotent)
-- ------------------------------------------------------------

ALTER TABLE public.figures
  DROP CONSTRAINT IF EXISTS figures_line_check;

ALTER TABLE public.figures
  ADD CONSTRAINT figures_line_check
  CHECK (line IN ('tomy', 't_arts'));


-- ------------------------------------------------------------
-- Verification (optional — run manually to confirm)
-- ------------------------------------------------------------
-- SELECT DISTINCT line FROM public.figures ORDER BY line;
-- Expected output: exactly 't_arts' and 'tomy'
