-- Allow reusing floor numbers, space identifiers, and bed labels after soft-delete.

ALTER TABLE floors DROP CONSTRAINT IF EXISTS floors_building_id_floor_number_key;
CREATE UNIQUE INDEX uq_floors_building_number_active
    ON floors (building_id, floor_number)
    WHERE deleted_at IS NULL;

ALTER TABLE spaces DROP CONSTRAINT IF EXISTS spaces_floor_id_space_type_identifier_key;
CREATE UNIQUE INDEX uq_spaces_floor_type_identifier_active
    ON spaces (floor_id, space_type, identifier)
    WHERE deleted_at IS NULL;

ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_space_id_bed_label_key;
CREATE UNIQUE INDEX uq_beds_space_label_active
    ON beds (space_id, bed_label)
    WHERE deleted_at IS NULL;
