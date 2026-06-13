-- Expand complaint categories (enum-based V1; no lookup table)

UPDATE complaints SET category = 'PLUMBING' WHERE category = 'WATER';
UPDATE complaints SET category = 'HOUSEKEEPING' WHERE category = 'CLEANING';

ALTER TABLE complaints DROP CONSTRAINT chk_complaint_category;

ALTER TABLE complaints ADD CONSTRAINT chk_complaint_category CHECK (
    category IN (
        'WIFI', 'FOOD', 'HOUSEKEEPING', 'MAINTENANCE', 'ELECTRICITY',
        'PLUMBING', 'SECURITY', 'NOISE', 'PAYMENT', 'OTHER'
    )
);

ALTER TABLE organization_metrics_cache
    ADD COLUMN complaint_category_counts JSONB NOT NULL DEFAULT '{}';
