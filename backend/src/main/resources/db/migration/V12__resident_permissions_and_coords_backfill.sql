-- Ensure demo / Hyderabad orgs have map coordinates
UPDATE organizations
SET latitude = 17.448294, longitude = 78.391487
WHERE slug = 'sunrise-hostel' AND (latitude IS NULL OR longitude IS NULL);

UPDATE organizations
SET latitude = 17.440081, longitude = 78.348912
WHERE slug = 'green-valley-residences' AND (latitude IS NULL OR longitude IS NULL);

UPDATE organizations
SET latitude = 17.385044, longitude = 78.486671
WHERE (latitude IS NULL OR longitude IS NULL) AND LOWER(city) LIKE '%hyderabad%';

-- Backfill resident role permissions that may be missing on orgs created before payment/viz permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'allocation:read_own',
    'payment:read_own',
    'announcement:read_own',
    'complaint:create',
    'complaint:read_own',
    'review:create',
    'review:update_own',
    'notification:read'
)
WHERE r.name = 'RESIDENT'
  AND r.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
