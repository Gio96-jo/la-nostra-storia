-- La Nostra Storia — Ronde 3
-- 1. Thema/stijl kolom op weddings
-- 2. is_highlighted kolom op checklist_items
-- 3. website + maps_url kolommen op day_schedule_items

-- =========================================================
-- 1. THEMA OP WEDDINGS
-- =========================================================
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'romantisch_blush';

ALTER TABLE public.weddings
  DROP CONSTRAINT IF EXISTS weddings_theme_check;

ALTER TABLE public.weddings
  ADD CONSTRAINT weddings_theme_check
  CHECK (theme IN (
    'klassiek_elegant',
    'romantisch_blush',
    'boho_natuurlijk',
    'rustiek_landelijk',
    'modern_minimalistisch',
    'vintage_retro',
    'tuinfeest_botanical',
    'mediterraan_italiaans'
  ));

-- =========================================================
-- 2. HIGHLIGHT OP CHECKLIST
-- =========================================================
ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN NOT NULL DEFAULT FALSE;

-- =========================================================
-- 3. WEBSITE + MAPS OP DAY SCHEDULE
-- =========================================================
ALTER TABLE public.day_schedule_items
  ADD COLUMN IF NOT EXISTS website TEXT;
