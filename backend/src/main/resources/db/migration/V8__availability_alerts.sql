-- Availability waitlist + extended notification types

CREATE TABLE availability_alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    CONSTRAINT uq_availability_alert_user_org UNIQUE (user_id, organization_id),
    CONSTRAINT chk_availability_alert_status CHECK (status IN ('PENDING', 'NOTIFIED', 'CANCELLED'))
);

CREATE INDEX idx_availability_alerts_org_pending
    ON availability_alerts(organization_id)
    WHERE status = 'PENDING';

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notification_type;

ALTER TABLE notifications
    ADD CONSTRAINT chk_notification_type CHECK (
        type IN (
            'JOIN_REQUEST_APPROVED',
            'JOIN_REQUEST_REJECTED',
            'JOIN_REQUEST_SUBMITTED',
            'COMPLAINT_CREATED',
            'COMPLAINT_ASSIGNED',
            'COMPLAINT_RESOLVED',
            'COMPLAINT_REOPENED',
            'ANNOUNCEMENT_PUBLISHED',
            'OCCUPANCY_ALLOCATED',
            'OCCUPANCY_TRANSFERRED',
            'REVIEW_REPORTED',
            'AVAILABILITY_OPEN',
            'SYSTEM'
        )
    );
