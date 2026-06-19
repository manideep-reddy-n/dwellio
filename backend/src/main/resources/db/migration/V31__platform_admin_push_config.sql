-- Platform administration expansion: push, preferences, config, delivery metrics

CREATE TABLE push_subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    endpoint        TEXT NOT NULL,
    p256dh          TEXT NOT NULL,
    auth_key        TEXT NOT NULL,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at    TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_push_subscriptions_user_endpoint
    ON push_subscriptions (user_id, endpoint)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id) WHERE deleted_at IS NULL;

CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    category        VARCHAR(30) NOT NULL,
    in_app_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, category)
);

CREATE TABLE platform_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key     VARCHAR(100) NOT NULL UNIQUE,
    category        VARCHAR(50) NOT NULL,
    value_json      JSONB NOT NULL DEFAULT '{}',
    description     TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES users(id)
);

CREATE TABLE notification_delivery_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    channel         VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_delivery_log_user ON notification_delivery_log(user_id, created_at DESC);
CREATE INDEX idx_notification_delivery_log_status ON notification_delivery_log(status, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

INSERT INTO platform_settings (id, setting_key, category, value_json, description) VALUES
    (gen_random_uuid(), 'notifications.push.enabled', 'notifications',
     '{"enabled": true}', 'Global browser push notifications'),
    (gen_random_uuid(), 'notifications.in_app.enabled', 'notifications',
     '{"enabled": true}', 'Global in-app notifications'),
    (gen_random_uuid(), 'notifications.email.enabled', 'notifications',
     '{"enabled": false}', 'Global email notifications (future)'),
    (gen_random_uuid(), 'billing.reminder.days_before', 'billing',
     '{"days": [5]}', 'Days before due date to send payment reminders'),
    (gen_random_uuid(), 'billing.grace_period_days', 'billing',
     '{"days": 0}', 'Grace period after due date before overdue'),
    (gen_random_uuid(), 'complaints.sla.first_response_hours', 'complaints',
     '{"hours": 24}', 'Default first-response SLA in hours'),
    (gen_random_uuid(), 'complaints.sla.resolution_hours', 'complaints',
     '{"hours": 72}', 'Default resolution SLA in hours'),
    (gen_random_uuid(), 'verification.required_documents.hostel', 'verification',
     '{"documents": ["BUSINESS_REGISTRATION","PROPERTY_PROOF","OWNER_ID"]}',
     'Required verification documents for hostels'),
    (gen_random_uuid(), 'verification.required_documents.pg', 'verification',
     '{"documents": ["BUSINESS_REGISTRATION","PROPERTY_PROOF","OWNER_ID"]}',
     'Required verification documents for PGs'),
    (gen_random_uuid(), 'verification.required_documents.gated_community', 'verification',
     '{"documents": ["ASSOCIATION_REGISTRATION","MANAGEMENT_AUTHORIZATION","PROPERTY_PROOF"]}',
     'Required verification documents for gated communities'),
    (gen_random_uuid(), 'marketplace.trust_score.weights', 'marketplace',
     '{"verified": 20, "review_rating": 10, "occupancy": 5}',
     'Marketplace ranking trust score weights');
