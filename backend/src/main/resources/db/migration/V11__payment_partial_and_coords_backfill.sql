ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_payment_status;
ALTER TABLE payments ADD CONSTRAINT chk_payment_status
    CHECK (status IN ('PAID', 'PENDING', 'PARTIAL', 'OVERDUE'));

UPDATE organizations
SET latitude = 17.448294, longitude = 78.391487
WHERE slug = 'sunrise-hostel' AND latitude IS NULL;

UPDATE organizations
SET latitude = 17.440081, longitude = 78.348912
WHERE slug = 'green-valley-residences' AND latitude IS NULL;

UPDATE organizations
SET latitude = 17.385044, longitude = 78.486671
WHERE latitude IS NULL AND LOWER(city) LIKE '%hyderabad%';

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS default_monthly_rent DECIMAL(12, 2);

UPDATE organizations SET default_monthly_rent = 8000 WHERE type IN ('HOSTEL', 'PG') AND default_monthly_rent IS NULL;
UPDATE organizations SET default_monthly_rent = 15000 WHERE type = 'GATED_COMMUNITY' AND default_monthly_rent IS NULL;
