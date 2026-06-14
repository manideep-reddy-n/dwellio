-- Organization verification workflow

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS chk_org_status;
UPDATE organizations SET status = 'DRAFT' WHERE status = 'PENDING';
ALTER TABLE organizations ALTER COLUMN status SET DEFAULT 'DRAFT';
ALTER TABLE organizations
    ADD CONSTRAINT chk_org_status CHECK (
        status IN ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED')
    );

CREATE TABLE organization_verification_requests (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    submitted_by_membership_id UUID NOT NULL REFERENCES memberships(id),
    status VARCHAR(25) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_verification_request_status CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED')
    )
);

CREATE INDEX idx_verification_requests_org ON organization_verification_requests(organization_id);
CREATE INDEX idx_verification_requests_status ON organization_verification_requests(status);

CREATE TABLE organization_verification_documents (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    verification_request_id UUID REFERENCES organization_verification_requests(id) ON DELETE SET NULL,
    document_type VARCHAR(40) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_verification_document_type CHECK (
        document_type IN (
            'BUSINESS_REGISTRATION',
            'TRADE_LICENSE',
            'PROPERTY_PROOF',
            'OWNER_ID',
            'ASSOCIATION_REGISTRATION',
            'MANAGEMENT_AUTHORIZATION',
            'OTHER'
        )
    )
);

CREATE INDEX idx_verification_documents_org ON organization_verification_documents(organization_id);
CREATE INDEX idx_verification_documents_request ON organization_verification_documents(verification_request_id);

INSERT INTO permissions (code, module, description) VALUES
    ('verification:manage', 'verification', 'Submit and manage organization verification'),
    ('verification:review', 'verification', 'Review organization verification requests (platform admin)')
ON CONFLICT (code) DO NOTHING;

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
            'SYSTEM'
        )
    );
