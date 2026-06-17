ALTER TABLE organizations
    ADD COLUMN sla_first_response_hours NUMERIC(8, 2) NOT NULL DEFAULT 24,
    ADD COLUMN sla_resolution_hours NUMERIC(8, 2) NOT NULL DEFAULT 72;
