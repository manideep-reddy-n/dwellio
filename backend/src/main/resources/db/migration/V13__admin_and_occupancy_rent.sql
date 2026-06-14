-- Platform admin account (username: admin, password: 12345678)
-- Per-occupancy monthly rent for hostel/PG billing

ALTER TABLE occupancies
    ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(12, 2);

-- Backfill existing occupancies from organization default
UPDATE occupancies o
SET monthly_rent = org.default_monthly_rent
FROM organizations org
WHERE o.organization_id = org.id
  AND o.monthly_rent IS NULL
  AND o.is_current = TRUE
  AND org.default_monthly_rent IS NOT NULL;

UPDATE occupancies o
SET monthly_rent = 8000
FROM organizations org
WHERE o.organization_id = org.id
  AND o.monthly_rent IS NULL
  AND o.is_current = TRUE
  AND org.type IN ('HOSTEL', 'PG', 'CO_LIVING');
