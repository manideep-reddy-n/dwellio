-- Phase G: billing mode on organizations, unit-linked charges, default rule seed

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(30) NOT NULL DEFAULT 'OCCUPANCY_ANCHOR',
    ADD COLUMN IF NOT EXISTS billing_custom_day SMALLINT;

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS chk_billing_mode;
ALTER TABLE organizations
    ADD CONSTRAINT chk_billing_mode CHECK (
        billing_mode IN ('CALENDAR_MONTH', 'OCCUPANCY_ANCHOR', 'CUSTOM_DAY')
    );

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS chk_billing_custom_day;
ALTER TABLE organizations
    ADD CONSTRAINT chk_billing_custom_day CHECK (
        billing_custom_day IS NULL OR (billing_custom_day >= 1 AND billing_custom_day <= 28)
    );

UPDATE organizations
SET billing_mode = 'CALENDAR_MONTH'
WHERE type = 'GATED_COMMUNITY'
  AND billing_mode = 'OCCUPANCY_ANCHOR';

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS unit_space_id UUID REFERENCES spaces(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_unit_charge_per_month
    ON payments (organization_id, unit_space_id, billing_month, charge_type)
    WHERE unit_space_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_unit
    ON payments (unit_space_id)
    WHERE unit_space_id IS NOT NULL AND deleted_at IS NULL;

-- Seed default maintenance rule for gated communities
INSERT INTO billing_rules (
    id,
    organization_id,
    charge_type,
    recurrence,
    default_amount,
    due_day_of_month,
    applies_to,
    bill_to,
    active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    o.id,
    'MAINTENANCE',
    'MONTHLY',
    2500.00,
    5,
    'ALL_ACTIVE_UNITS',
    'OWNER',
    TRUE,
    now(),
    now()
FROM organizations o
WHERE o.type = 'GATED_COMMUNITY'
  AND o.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM billing_rules br WHERE br.organization_id = o.id AND br.charge_type = 'MAINTENANCE'
  );
