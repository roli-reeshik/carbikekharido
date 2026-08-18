-- Safer migration without IF NOT EXISTS (compatible with MySQL 5.7+ / MariaDB 10.6+).
-- Ignore "Duplicate column" errors if re-running.

ALTER TABLE vehicles ADD COLUMN model_year YEAR NULL AFTER variant_name;
ALTER TABLE vehicles ADD COLUMN external_variant_id VARCHAR(120) NULL AFTER model_year;
ALTER TABLE vehicles ADD COLUMN last_synced_at DATETIME NULL AFTER external_variant_id;

CREATE UNIQUE INDEX uq_vehicles_external_variant ON vehicles (external_variant_id);

ALTER TABLE vehicle_images ADD COLUMN source ENUM('aggregator','manual','legacy') NOT NULL DEFAULT 'legacy';
ALTER TABLE vehicle_images ADD COLUMN storage_key VARCHAR(500) NULL;
