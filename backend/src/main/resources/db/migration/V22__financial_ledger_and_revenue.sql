-- Financial ledger (append-only membership running balance)
CREATE TABLE IF NOT EXISTS financial_ledger_entries (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id),
    membership_id     UUID NOT NULL REFERENCES memberships(id),
    payment_id        UUID REFERENCES payments(id),
    entry_type        VARCHAR(30) NOT NULL,
    amount            DECIMAL(12, 2) NOT NULL,
    balance_after     DECIMAL(12, 2) NOT NULL,
    description       VARCHAR(500),
    reference_month   DATE,
    created_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_ledger_entry_type CHECK (
        entry_type IN (
            'CHARGE_GENERATED',
            'PAYMENT_RECEIVED',
            'REFUND',
            'PENALTY_APPLIED',
            'ADJUSTMENT'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_ledger_org_membership
    ON financial_ledger_entries (organization_id, membership_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_payment
    ON financial_ledger_entries (payment_id) WHERE payment_id IS NOT NULL;

-- Organization billing rules (future-ready; seeded defaults per org type)
CREATE TABLE IF NOT EXISTS billing_rules (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id),
    charge_type       VARCHAR(30) NOT NULL,
    recurrence        VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    default_amount    DECIMAL(12, 2),
    due_day_of_month  SMALLINT,
    applies_to        VARCHAR(40) NOT NULL DEFAULT 'ALL_ACTIVE_OCCUPANCIES',
    bill_to           VARCHAR(20) NOT NULL DEFAULT 'RESIDENT',
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_billing_recurrence CHECK (recurrence IN ('MONTHLY', 'ONE_TIME')),
    CONSTRAINT chk_billing_bill_to CHECK (bill_to IN ('RESIDENT', 'OWNER', 'TENANT'))
);

CREATE INDEX IF NOT EXISTS idx_billing_rules_org ON billing_rules (organization_id) WHERE active = TRUE;

-- Payment reminder deduplication
CREATE TABLE IF NOT EXISTS payment_reminder_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID NOT NULL REFERENCES payments(id),
    reminder_type   VARCHAR(30) NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_reminder_type CHECK (
        reminder_type IN ('FIVE_DAYS_BEFORE', 'DUE_TODAY', 'OVERDUE')
    ),
    UNIQUE (payment_id, reminder_type)
);

-- Revenue metrics projection columns
ALTER TABLE organization_metrics_cache
    ADD COLUMN IF NOT EXISTS expected_revenue_month DECIMAL(14, 2),
    ADD COLUMN IF NOT EXISTS collected_revenue_month DECIMAL(14, 2),
    ADD COLUMN IF NOT EXISTS outstanding_revenue_month DECIMAL(14, 2),
    ADD COLUMN IF NOT EXISTS collection_rate DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS defaulters_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS revenue_trend_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS forecast_revenue_next_month DECIMAL(14, 2);
