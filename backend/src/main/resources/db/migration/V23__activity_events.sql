-- Resident / ops activity timeline (append-only)
CREATE TABLE IF NOT EXISTS activity_events (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id),
    membership_id     UUID REFERENCES memberships(id),
    event_category    VARCHAR(30) NOT NULL,
    event_type        VARCHAR(50) NOT NULL,
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at       TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_activity_category CHECK (
        event_category IN ('BILLING', 'ACCOMMODATION', 'COMPLAINT', 'REVIEW', 'MEMBERSHIP')
    )
);

CREATE INDEX IF NOT EXISTS idx_activity_org_occurred
    ON activity_events (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_membership
    ON activity_events (organization_id, membership_id, occurred_at DESC)
    WHERE membership_id IS NOT NULL;
