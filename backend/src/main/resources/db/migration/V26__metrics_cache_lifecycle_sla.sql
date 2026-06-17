-- Phase B: resident lifecycle, complaint SLA, pending payments, meal rating slots on metrics cache
ALTER TABLE organization_metrics_cache
    ADD COLUMN IF NOT EXISTS move_ins_month INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS move_outs_month INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avg_stay_days DECIMAL(8, 2),
    ADD COLUMN IF NOT EXISTS turnover_rate DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS pending_payments_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sla_first_response_hours DECIMAL(6, 2) NOT NULL DEFAULT 24,
    ADD COLUMN IF NOT EXISTS sla_resolution_hours DECIMAL(8, 2) NOT NULL DEFAULT 72,
    ADD COLUMN IF NOT EXISTS sla_compliance_rate DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS sla_violations_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reopened_complaints_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avg_breakfast_rating DECIMAL(3, 2),
    ADD COLUMN IF NOT EXISTS avg_lunch_rating DECIMAL(3, 2),
    ADD COLUMN IF NOT EXISTS avg_dinner_rating DECIMAL(3, 2),
    ADD COLUMN IF NOT EXISTS meal_ratings_trend_json JSONB NOT NULL DEFAULT '[]'::jsonb;
