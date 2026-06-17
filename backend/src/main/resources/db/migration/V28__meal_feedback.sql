CREATE TABLE meal_feedback (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations (id),
    membership_id   UUID NOT NULL REFERENCES memberships (id),
    feedback_date   DATE NOT NULL,
    meal_type       VARCHAR(20) NOT NULL,
    rating          SMALLINT NOT NULL,
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT meal_feedback_rating_check CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT meal_feedback_meal_type_check CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER')),
    CONSTRAINT meal_feedback_unique_per_meal UNIQUE (organization_id, membership_id, feedback_date, meal_type)
);

CREATE INDEX idx_meal_feedback_org_date ON meal_feedback (organization_id, feedback_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_meal_feedback_membership ON meal_feedback (membership_id, feedback_date)
    WHERE deleted_at IS NULL;
