-- Enforce at most one current occupancy per membership

CREATE UNIQUE INDEX uq_occupancy_current_membership
    ON occupancies(membership_id) WHERE is_current = TRUE;
