-- Seed subscription plans and global permission catalog

INSERT INTO subscription_plans (id, code, name, max_residents, max_buildings) VALUES
    ('00000000-0000-0000-0000-000000000001', 'FREE', 'Free Plan', NULL, NULL),
    ('00000000-0000-0000-0000-000000000002', 'PRO', 'Pro Plan', NULL, NULL),
    ('00000000-0000-0000-0000-000000000003', 'ENTERPRISE', 'Enterprise Plan', NULL, NULL);

INSERT INTO permissions (code, module, description) VALUES
    ('organization:read', 'organization', 'View organization details'),
    ('organization:update', 'organization', 'Update organization profile'),
    ('staff:manage', 'staff', 'Manage staff accounts'),
    ('resident:read', 'resident', 'View residents'),
    ('resident:manage', 'resident', 'Manage residents'),
    ('resident:approve', 'resident', 'Approve join requests'),
    ('building:manage', 'building', 'Manage buildings and structure'),
    ('complaint:read', 'complaint', 'View all complaints'),
    ('complaint:manage', 'complaint', 'Manage complaints'),
    ('complaint:assign', 'complaint', 'Assign complaints'),
    ('payment:read', 'payment', 'View all payments'),
    ('payment:manage', 'payment', 'Manage payments'),
    ('announcement:read', 'announcement', 'View announcements'),
    ('announcement:manage', 'announcement', 'Manage announcements'),
    ('asset:read', 'asset', 'View assets'),
    ('asset:manage', 'asset', 'Manage assets'),
    ('review:read', 'review', 'View reviews'),
    ('role:manage', 'role', 'Manage roles and permissions'),
    ('contact:manage', 'contact', 'Manage organization contacts'),
    ('dashboard:view', 'dashboard', 'View organization dashboard'),
    ('announcement:read_own', 'announcement', 'View announcements as resident'),
    ('complaint:create', 'complaint', 'Create complaints'),
    ('complaint:read_own', 'complaint', 'View own complaints'),
    ('payment:read_own', 'payment', 'View own payments'),
    ('review:create', 'review', 'Submit reviews'),
    ('review:update_own', 'review', 'Update own review'),
    ('allocation:read_own', 'allocation', 'View own room/bed/unit allocation'),
    ('notification:read', 'notification', 'View notifications');

INSERT INTO amenities (name, icon) VALUES
    ('WiFi', 'wifi'),
    ('Laundry', 'laundry'),
    ('Parking', 'parking'),
    ('Gym', 'gym'),
    ('Power Backup', 'power'),
    ('CCTV', 'cctv'),
    ('Housekeeping', 'housekeeping'),
    ('Food Service', 'food'),
    ('Water Purifier', 'water'),
    ('Security', 'security');
