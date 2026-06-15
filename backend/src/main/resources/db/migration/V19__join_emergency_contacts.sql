-- Join request emergency contacts + notification retention index
ALTER TABLE join_requests
    ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
