-- La Nostra Storia — Notities verbeteringen
-- 1. sort_order: zodat notities via drag & drop gesorteerd kunnen worden
-- 2. is_important: één "belangrijke" notitie per bruiloft, die op het dashboard verschijnt

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: geef bestaande notities een sort_order op basis van pinned + created_at
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY wedding_id
      ORDER BY pinned DESC, created_at DESC
    ) AS rn
  FROM public.notes
)
UPDATE public.notes n
SET sort_order = ranked.rn
FROM ranked
WHERE n.id = ranked.id;

CREATE INDEX IF NOT EXISTS notes_wedding_sort_idx
  ON public.notes (wedding_id, sort_order);

CREATE INDEX IF NOT EXISTS notes_wedding_important_idx
  ON public.notes (wedding_id) WHERE is_important = TRUE;
