-- CommunityOS initial schema (approved architecture)
-- Phase 1: full foundation for all modules

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Subscription plans
-- =============================================================================

CREATE TABLE subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    max_residents   INT,
    max_buildings   INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Users & auth tokens
-- =============================================================================

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    phone             VARCHAR(50) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(255) NOT NULL,
    avatar_url        VARCHAR(500),
    is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- =============================================================================
-- Organizations
-- =============================================================================

CREATE TABLE organizations (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                       VARCHAR(100) NOT NULL UNIQUE,
    name                       VARCHAR(255) NOT NULL,
    description                TEXT,
    type                       VARCHAR(50) NOT NULL,
    accommodation_mode         VARCHAR(20) NOT NULL,
    status                     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    plan_id                    UUID NOT NULL REFERENCES subscription_plans(id),
    address_line               VARCHAR(500),
    city                       VARCHAR(100) NOT NULL,
    area                       VARCHAR(100),
    state                      VARCHAR(100),
    postal_code                VARCHAR(20),
    country                    VARCHAR(100) NOT NULL DEFAULT 'IN',
    latitude                   DECIMAL(10, 8),
    longitude                  DECIMAL(11, 8),
    contact_phone              VARCHAR(50),
    contact_email              VARCHAR(255),
    verified_at                TIMESTAMPTZ,
    verified_by                UUID REFERENCES users(id),
    rejection_reason           TEXT,
    profile_completeness_score SMALLINT NOT NULL DEFAULT 0,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                 TIMESTAMPTZ,

    CONSTRAINT chk_org_type CHECK (
        type IN ('HOSTEL', 'PG', 'CO_LIVING', 'GATED_COMMUNITY')
    ),
    CONSTRAINT chk_accommodation_mode CHECK (
        accommodation_mode IN ('BED_BASED', 'UNIT_BASED')
    ),
    CONSTRAINT chk_org_accommodation_type CHECK (
        (type IN ('HOSTEL', 'PG', 'CO_LIVING') AND accommodation_mode = 'BED_BASED')
        OR (type = 'GATED_COMMUNITY' AND accommodation_mode = 'UNIT_BASED')
    ),
    CONSTRAINT chk_org_status CHECK (
        status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')
    )
);

CREATE INDEX idx_organizations_search ON organizations(city, area, type, status)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;

CREATE TABLE organization_photos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    cloudinary_url  VARCHAR(500) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organization_photos_org ON organization_photos(organization_id);

CREATE TABLE organization_contacts (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      UUID NOT NULL REFERENCES organizations(id),
    contact_type         VARCHAR(30) NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    phone                VARCHAR(50),
    email                VARCHAR(255),
    visible_to_residents BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ,

    CONSTRAINT chk_contact_type CHECK (
        contact_type IN ('OWNER', 'MANAGER', 'EMERGENCY', 'MAINTENANCE', 'SECURITY')
    )
);

CREATE INDEX idx_organization_contacts_org ON organization_contacts(organization_id)
    WHERE deleted_at IS NULL;

-- =============================================================================
-- Amenities
-- =============================================================================

CREATE TABLE amenities (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    icon       VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organization_amenities (
    organization_id UUID NOT NULL REFERENCES organizations(id),
    amenity_id      UUID NOT NULL REFERENCES amenities(id),
    PRIMARY KEY (organization_id, amenity_id)
);

-- =============================================================================
-- RBAC
-- =============================================================================

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) NOT NULL UNIQUE,
    module      VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(100) NOT NULL,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    is_owner_role   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_roles_org ON roles(organization_id) WHERE deleted_at IS NULL;

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =============================================================================
-- Memberships & join flow
-- =============================================================================

CREATE TABLE memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    role_id         UUID NOT NULL REFERENCES roles(id),
    status          VARCHAR(20) NOT NULL,
    joined_at       TIMESTAMPTZ,
    left_at         TIMESTAMPTZ,
    exit_reason     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (user_id, organization_id),

    CONSTRAINT chk_membership_status CHECK (
        status IN ('ACTIVE', 'REJECTED', 'LEFT')
    )
);

CREATE INDEX idx_memberships_user ON memberships(user_id, status);
CREATE INDEX idx_memberships_org ON memberships(organization_id, status)
    WHERE deleted_at IS NULL;

CREATE TABLE resident_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id           UUID NOT NULL UNIQUE REFERENCES memberships(id),
    emergency_contact_name  VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_resident_status CHECK (
        status IN ('ACTIVE', 'INACTIVE', 'LEFT')
    )
);

CREATE TABLE join_requests (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id),
    organization_id  UUID NOT NULL REFERENCES organizations(id),
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message          TEXT,
    reviewed_by      UUID REFERENCES users(id),
    reviewed_at      TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_join_request_status CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
    )
);

CREATE INDEX idx_join_requests_org ON join_requests(organization_id, status);
CREATE INDEX idx_join_requests_user ON join_requests(user_id, status);

CREATE TABLE join_request_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    join_request_id UUID NOT NULL REFERENCES join_requests(id) ON DELETE CASCADE,
    document_type   VARCHAR(30) NOT NULL,
    custom_label    VARCHAR(100),
    cloudinary_url  VARCHAR(500) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_document_type CHECK (
        document_type IN ('COLLEGE_ID', 'EMPLOYEE_ID', 'GOVERNMENT_ID', 'CUSTOM')
    )
);

-- =============================================================================
-- Spatial hierarchy (Building → Floor → Space → Bed)
-- =============================================================================

CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_buildings_org ON buildings(organization_id) WHERE deleted_at IS NULL;

CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id     UUID NOT NULL REFERENCES buildings(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    floor_number    INT NOT NULL,
    name            VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (building_id, floor_number)
);

CREATE INDEX idx_floors_org ON floors(organization_id) WHERE deleted_at IS NULL;

CREATE TABLE spaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id        UUID NOT NULL REFERENCES floors(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    space_type      VARCHAR(10) NOT NULL,
    identifier      VARCHAR(50) NOT NULL,
    display_name    VARCHAR(100),
    status          VARCHAR(25) NOT NULL DEFAULT 'AVAILABLE',
    capacity        INT NOT NULL DEFAULT 1,
    is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (floor_id, space_type, identifier),

    CONSTRAINT chk_space_type CHECK (space_type IN ('ROOM', 'UNIT')),
    CONSTRAINT chk_space_status CHECK (
        status IN ('AVAILABLE', 'OCCUPIED', 'BLOCKED', 'PARTIALLY_OCCUPIED')
    )
);

CREATE INDEX idx_spaces_org ON spaces(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_spaces_floor ON spaces(floor_id) WHERE deleted_at IS NULL;

CREATE TABLE beds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id        UUID NOT NULL REFERENCES spaces(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    bed_label       VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (space_id, bed_label),

    CONSTRAINT chk_bed_status CHECK (
        status IN ('AVAILABLE', 'OCCUPIED', 'BLOCKED')
    )
);

CREATE INDEX idx_beds_org ON beds(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_beds_space ON beds(space_id) WHERE deleted_at IS NULL;

CREATE TABLE occupancies (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id),
    membership_id     UUID NOT NULL REFERENCES memberships(id),
    occupancy_target  VARCHAR(10) NOT NULL,
    bed_id            UUID REFERENCES beds(id),
    unit_space_id     UUID REFERENCES spaces(id),
    move_in_date      DATE NOT NULL,
    move_out_date     DATE,
    is_current        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_occupancy_target CHECK (occupancy_target IN ('BED', 'UNIT')),
    CONSTRAINT chk_occupancy_target_fk CHECK (
        (occupancy_target = 'BED' AND bed_id IS NOT NULL AND unit_space_id IS NULL)
        OR (occupancy_target = 'UNIT' AND unit_space_id IS NOT NULL AND bed_id IS NULL)
    )
);

CREATE UNIQUE INDEX uq_occupancy_current_bed
    ON occupancies(bed_id) WHERE is_current = TRUE AND bed_id IS NOT NULL;
CREATE UNIQUE INDEX uq_occupancy_current_unit
    ON occupancies(unit_space_id) WHERE is_current = TRUE AND unit_space_id IS NOT NULL;
CREATE INDEX idx_occupancies_membership ON occupancies(membership_id, is_current);
CREATE INDEX idx_occupancies_org ON occupancies(organization_id);

-- =============================================================================
-- Operations modules
-- =============================================================================

CREATE TABLE complaints (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id           UUID NOT NULL REFERENCES organizations(id),
    created_by_membership_id  UUID NOT NULL REFERENCES memberships(id),
    assigned_to_membership_id UUID REFERENCES memberships(id),
    title                     VARCHAR(255) NOT NULL,
    description               TEXT NOT NULL,
    category                  VARCHAR(30) NOT NULL,
    priority                  VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status                    VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolved_at               TIMESTAMPTZ,
    closed_at                 TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                TIMESTAMPTZ,

    CONSTRAINT chk_complaint_category CHECK (
        category IN ('WIFI', 'WATER', 'ELECTRICITY', 'CLEANING', 'SECURITY', 'MAINTENANCE', 'OTHER')
    ),
    CONSTRAINT chk_complaint_priority CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    CONSTRAINT chk_complaint_status CHECK (
        status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
    )
);

CREATE INDEX idx_complaints_org ON complaints(organization_id, status) WHERE deleted_at IS NULL;

CREATE TABLE complaint_attachments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id   UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    cloudinary_url VARCHAR(500) NOT NULL,
    file_type      VARCHAR(10) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_attachment_file_type CHECK (file_type IN ('IMAGE', 'PDF'))
);

CREATE TABLE announcements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    created_by      UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    type            VARCHAR(30) NOT NULL,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT chk_announcement_type CHECK (
        type IN ('GENERAL', 'MAINTENANCE', 'EVENT', 'PAYMENT_REMINDER')
    )
);

CREATE INDEX idx_announcements_org ON announcements(organization_id) WHERE deleted_at IS NULL;

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    membership_id   UUID NOT NULL REFERENCES memberships(id),
    billing_month   DATE NOT NULL,
    amount          DECIMAL(12, 2) NOT NULL,
    due_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes           TEXT,
    recorded_by     UUID REFERENCES users(id),
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (membership_id, billing_month),

    CONSTRAINT chk_payment_status CHECK (status IN ('PAID', 'PENDING', 'OVERDUE'))
);

CREATE INDEX idx_payments_org ON payments(organization_id, status) WHERE deleted_at IS NULL;

CREATE TABLE assets (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL REFERENCES organizations(id),
    name                  VARCHAR(255) NOT NULL,
    category              VARCHAR(100) NOT NULL,
    status                VARCHAR(30) NOT NULL DEFAULT 'WORKING',
    building_id           UUID REFERENCES buildings(id),
    floor_id              UUID REFERENCES floors(id),
    space_id              UUID REFERENCES spaces(id),
    bed_id                UUID REFERENCES beds(id),
    purchase_date         DATE,
    last_maintenance_date DATE,
    photo_url             VARCHAR(500),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,

    CONSTRAINT chk_asset_status CHECK (
        status IN ('WORKING', 'MAINTENANCE_REQUIRED', 'OUT_OF_SERVICE')
    )
);

CREATE INDEX idx_assets_org ON assets(organization_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- Reviews & metrics
-- =============================================================================

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    membership_id   UUID NOT NULL UNIQUE REFERENCES memberships(id),
    rating          SMALLINT NOT NULL,
    body            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_reviews_org ON reviews(organization_id) WHERE deleted_at IS NULL;

CREATE TABLE review_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id    UUID NOT NULL REFERENCES reviews(id),
    reported_by  UUID NOT NULL REFERENCES users(id),
    reason       TEXT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_review_report_status CHECK (
        status IN ('PENDING', 'DISMISSED', 'ACTION_TAKEN')
    )
);

CREATE TABLE organization_metrics_cache (
    organization_id         UUID PRIMARY KEY REFERENCES organizations(id),
    accommodation_mode      VARCHAR(20) NOT NULL,
    active_resident_count   INT NOT NULL DEFAULT 0,
    avg_rating              DECIMAL(3, 2),
    review_count            INT NOT NULL DEFAULT 0,
    avg_resolution_days     DECIMAL(6, 2),
    resolution_rate         DECIMAL(5, 2),
    open_complaint_count    INT NOT NULL DEFAULT 0,
    satisfaction_score      DECIMAL(5, 2),
    search_rank_score       DECIMAL(8, 4),
    total_rooms             INT,
    vacant_rooms            INT,
    partial_rooms           INT,
    occupied_rooms          INT,
    blocked_rooms           INT,
    total_beds              INT,
    available_beds          INT,
    occupied_beds           INT,
    blocked_beds            INT,
    total_units             INT,
    available_units         INT,
    occupied_units          INT,
    blocked_units           INT,
    refreshed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_metrics_accommodation_mode CHECK (
        accommodation_mode IN ('BED_BASED', 'UNIT_BASED')
    )
);

-- =============================================================================
-- Notifications & audit
-- =============================================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    entity_type     VARCHAR(50),
    entity_id       UUID,
    status          VARCHAR(10) NOT NULL DEFAULT 'UNREAD',
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_notification_status CHECK (status IN ('UNREAD', 'READ'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id, status);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    actor_user_id   UUID NOT NULL REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);
