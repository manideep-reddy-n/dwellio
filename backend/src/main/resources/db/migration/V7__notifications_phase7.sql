-- Phase 7: notification payload JSON and typed notification categories

ALTER TABLE notifications
    ADD COLUMN payload_json JSONB;

ALTER TABLE notifications
    DROP COLUMN IF EXISTS entity_type,
    DROP COLUMN IF EXISTS entity_id;

ALTER TABLE notifications
    ADD CONSTRAINT chk_notification_type CHECK (
        type IN (
            'JOIN_REQUEST_APPROVED',
            'JOIN_REQUEST_REJECTED',
            'COMPLAINT_CREATED',
            'COMPLAINT_ASSIGNED',
            'COMPLAINT_RESOLVED',
            'COMPLAINT_REOPENED',
            'ANNOUNCEMENT_PUBLISHED',
            'OCCUPANCY_ALLOCATED',
            'OCCUPANCY_TRANSFERRED',
            'REVIEW_REPORTED',
            'SYSTEM'
        )
    );

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id)
    WHERE status = 'UNREAD';
