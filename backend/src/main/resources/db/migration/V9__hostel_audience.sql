ALTER TABLE organizations
    ADD COLUMN hostel_audience VARCHAR(20);

ALTER TABLE organizations
    ADD CONSTRAINT chk_hostel_audience CHECK (
        hostel_audience IS NULL OR hostel_audience IN ('BOYS', 'GIRLS', 'CO_ED')
    );
