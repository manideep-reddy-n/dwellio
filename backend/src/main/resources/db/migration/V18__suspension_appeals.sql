-- Organization suspension appeals

CREATE TABLE organization_suspension_appeals (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    submitted_by_membership_id UUID NOT NULL REFERENCES memberships(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_suspension_appeal_status CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED'))
);

CREATE INDEX idx_suspension_appeals_org ON organization_suspension_appeals(organization_id);

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
            'PAYMENT_DUE',
            'INVOICE_SHARED',
            'LEAVE_REQUEST_SUBMITTED',
            'LEAVE_REQUEST_APPROVED',
            'LEAVE_REQUEST_REJECTED',
            'FOOD_MENU_UPDATED',
            'ORGANIZATION_VERIFIED',
            'ORGANIZATION_VERIFICATION_SUBMITTED',
            'ORGANIZATION_VERIFICATION_REJECTED',
            'ORGANIZATION_VERIFICATION_MORE_INFO',
            'ORGANIZATION_SUSPENDED',
            'SUSPENSION_APPEAL_SUBMITTED',
            'SYSTEM'
        )
    );
