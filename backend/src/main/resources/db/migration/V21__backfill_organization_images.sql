-- Backfill marketplace gallery from legacy organization_photos rows.
INSERT INTO organization_images (id, organization_id, url, sort_order, created_at, updated_at)
SELECT op.id,
       op.organization_id,
       op.cloudinary_url,
       op.sort_order,
       op.created_at,
       op.created_at
FROM organization_photos op
WHERE NOT EXISTS (
    SELECT 1 FROM organization_images oi WHERE oi.id = op.id
);
