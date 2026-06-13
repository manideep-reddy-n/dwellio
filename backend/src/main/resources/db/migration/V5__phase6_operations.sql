-- Phase 6: complaint SLA fields, asset linkage, REOPENED state, first-response metrics

ALTER TABLE complaints
    ADD COLUMN asset_id UUID REFERENCES assets(id),
    ADD COLUMN assigned_at TIMESTAMPTZ,
    ADD COLUMN first_response_at TIMESTAMPTZ;

ALTER TABLE complaints DROP CONSTRAINT chk_complaint_status;

ALTER TABLE complaints ADD CONSTRAINT chk_complaint_status CHECK (
    status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED')
);

CREATE INDEX idx_complaints_asset ON complaints(asset_id)
    WHERE deleted_at IS NULL AND asset_id IS NOT NULL;

ALTER TABLE organization_metrics_cache
    ADD COLUMN avg_first_response_hours DECIMAL(8, 2);
