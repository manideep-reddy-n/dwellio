-- Idempotent activity event sources for backfill and forward writes
ALTER TABLE activity_events
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS source_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_source_dedupe
    ON activity_events (organization_id, event_type, source_type, source_id)
    WHERE source_type IS NOT NULL AND source_id IS NOT NULL;
