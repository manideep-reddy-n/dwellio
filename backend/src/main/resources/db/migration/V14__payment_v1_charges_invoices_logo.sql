-- V1 payment extensions: charge types, invoices, org logo

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS charge_type VARCHAR(30) NOT NULL DEFAULT 'RENT',
    ADD COLUMN IF NOT EXISTS description VARCHAR(500);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_membership_id_billing_month_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_rent_per_month
    ON payments (membership_id, billing_month)
    WHERE charge_type = 'RENT' AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID NOT NULL REFERENCES payments(id),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    invoice_number      VARCHAR(64) NOT NULL UNIQUE,
    verification_token  VARCHAR(64) NOT NULL UNIQUE,
    verification_hash   VARCHAR(128) NOT NULL,
    pdf_path            VARCHAR(500),
    status              VARCHAR(20) NOT NULL DEFAULT 'GENERATED',
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    generated_by        UUID REFERENCES users(id),
    shared_at           TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoices_payment ON invoices (payment_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS invoice_verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID REFERENCES invoices(id),
    invoice_number  VARCHAR(64),
    result          VARCHAR(20) NOT NULL,
    client_ip       VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
