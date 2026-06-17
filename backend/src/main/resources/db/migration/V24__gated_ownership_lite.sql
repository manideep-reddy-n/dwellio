-- Gated community ownership lite (no legal/sale workflows)
CREATE TABLE IF NOT EXISTS unit_ownership_records (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id),
    unit_space_id           UUID NOT NULL REFERENCES spaces(id),
    owner_name              VARCHAR(200) NOT NULL,
    owner_email             VARCHAR(255),
    owner_phone             VARCHAR(30),
    billing_responsibility  VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    effective_from          DATE NOT NULL,
    effective_to            DATE,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_billing_responsibility CHECK (
        billing_responsibility IN ('OWNER', 'TENANT', 'RESIDENT')
    )
);

CREATE INDEX IF NOT EXISTS idx_ownership_unit
    ON unit_ownership_records (organization_id, unit_space_id, effective_from DESC);

ALTER TABLE occupancies
    ADD COLUMN IF NOT EXISTS occupancy_classification VARCHAR(30);

ALTER TABLE occupancies
    ADD CONSTRAINT chk_occupancy_classification CHECK (
        occupancy_classification IS NULL
        OR occupancy_classification IN ('RESIDENT', 'OWNER_OCCUPIED', 'TENANT_OCCUPIED', 'VACANT')
    );
