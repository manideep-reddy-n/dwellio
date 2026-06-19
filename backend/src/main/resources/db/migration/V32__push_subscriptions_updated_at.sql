-- PushSubscription extends BaseEntity which requires updated_at
ALTER TABLE push_subscriptions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
