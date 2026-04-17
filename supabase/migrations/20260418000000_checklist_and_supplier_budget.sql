-- La Nostra Storia — Ronde 1 verbeteringen
-- 1. Checklist: status (open/in_progress/done) en is_urgent
-- 2. Leveranciers koppelen automatisch aan budget

-- =========================================================
-- 1. CHECKLIST STATUS + URGENT
-- =========================================================

ALTER TABLE checklist_items
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';

ALTER TABLE checklist_items
  DROP CONSTRAINT IF EXISTS checklist_status_check;

ALTER TABLE checklist_items
  ADD CONSTRAINT checklist_status_check
  CHECK (status IN ('open', 'in_progress', 'done'));

ALTER TABLE checklist_items
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill status van bestaande taken op basis van is_completed
UPDATE checklist_items SET status = 'done' WHERE is_completed = TRUE AND status = 'open';

-- Trigger: houdt is_completed automatisch in sync met status
CREATE OR REPLACE FUNCTION sync_checklist_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_completed := (NEW.status = 'done');
  IF NEW.is_completed AND (OLD IS NULL OR OLD.is_completed IS DISTINCT FROM NEW.is_completed) THEN
    NEW.completed_at := NOW();
  ELSIF NOT NEW.is_completed THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_checklist_completion_trigger ON checklist_items;
CREATE TRIGGER sync_checklist_completion_trigger
  BEFORE INSERT OR UPDATE OF status ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION sync_checklist_completion();

-- =========================================================
-- 2. LEVERANCIERS → BUDGET SYNC
-- =========================================================
-- Zodra een leverancier een agreed_price heeft wordt er automatisch
-- een budget-regel aangemaakt/bijgewerkt. Verwijderen van leverancier
-- laat budget-regel staan, maar ontkoppelt hem.

CREATE OR REPLACE FUNCTION sync_supplier_to_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.agreed_price IS NOT NULL AND NEW.agreed_price > 0 THEN
      INSERT INTO budget_items (wedding_id, supplier_id, category, description, estimated_cost)
      VALUES (NEW.wedding_id, NEW.id, NEW.category, NEW.name, NEW.agreed_price);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.agreed_price IS NOT NULL AND NEW.agreed_price > 0 THEN
      IF EXISTS (SELECT 1 FROM budget_items WHERE supplier_id = NEW.id) THEN
        UPDATE budget_items
        SET description = NEW.name,
            category = NEW.category,
            estimated_cost = NEW.agreed_price,
            is_paid = CASE WHEN NEW.status = 'betaald' THEN TRUE ELSE is_paid END,
            updated_at = NOW()
        WHERE supplier_id = NEW.id;
      ELSE
        INSERT INTO budget_items (wedding_id, supplier_id, category, description, estimated_cost, is_paid)
        VALUES (NEW.wedding_id, NEW.id, NEW.category, NEW.name, NEW.agreed_price, NEW.status = 'betaald');
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_supplier_budget_trigger ON suppliers;
CREATE TRIGGER sync_supplier_budget_trigger
  AFTER INSERT OR UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION sync_supplier_to_budget();

-- Backfill: maak budget-regels aan voor bestaande leveranciers met een prijs
-- die nog geen budget-regel hebben
INSERT INTO budget_items (wedding_id, supplier_id, category, description, estimated_cost, is_paid)
SELECT s.wedding_id, s.id, s.category, s.name, s.agreed_price, (s.status = 'betaald')
FROM suppliers s
WHERE s.agreed_price IS NOT NULL
  AND s.agreed_price > 0
  AND NOT EXISTS (SELECT 1 FROM budget_items b WHERE b.supplier_id = s.id);
