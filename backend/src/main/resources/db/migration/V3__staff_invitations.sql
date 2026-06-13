-- Staff invitations for users not yet registered (V1 records only; fulfillment is future)

CREATE TABLE staff_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email           VARCHAR(255) NOT NULL,
    role_id         UUID NOT NULL REFERENCES roles(id),
    invited_by      UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_staff_invitation_status CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED'))
);

CREATE UNIQUE INDEX uq_staff_invitations_pending_email
    ON staff_invitations(organization_id, email) WHERE status = 'PENDING';
CREATE INDEX idx_staff_invitations_org ON staff_invitations(organization_id, status);
