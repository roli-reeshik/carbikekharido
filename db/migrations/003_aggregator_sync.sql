-- =============================================================================
-- Aggregator sync support — vehicle offers, sync audit log, image provenance
-- Run: mysql -u root -p carbikedekho < db/migrations/003_aggregator_sync.sql
-- =============================================================================

SET NAMES utf8mb4;

-- Run 003_aggregator_sync_alter.sql first if upgrading an existing database.
CREATE TABLE IF NOT EXISTS vehicle_offers (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id          BIGINT UNSIGNED NOT NULL,
  title               VARCHAR(300) NOT NULL,
  description         TEXT NULL,
  discount_amount     DECIMAL(12,2) NULL,
  valid_from          DATE NULL,
  valid_till          DATE NOT NULL,
  source              ENUM('aggregator','manual') NOT NULL DEFAULT 'aggregator',
  external_offer_id   VARCHAR(120) NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vo_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_vo_external (vehicle_id, external_offer_id),
  INDEX idx_vo_active (vehicle_id, is_active, valid_till)
) ENGINE=InnoDB;

-- Audit trail for nightly cron runs — ops can inspect partial failures.
CREATE TABLE IF NOT EXISTS aggregator_sync_runs (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  started_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at          DATETIME NULL,
  status              ENUM('running','success','partial','failed') NOT NULL DEFAULT 'running',
  vehicles_processed  INT UNSIGNED NOT NULL DEFAULT 0,
  images_processed    INT UNSIGNED NOT NULL DEFAULT 0,
  offers_processed    INT UNSIGNED NOT NULL DEFAULT 0,
  errors_count        INT UNSIGNED NOT NULL DEFAULT 0,
  error_log           TEXT NULL,
  trigger_source      ENUM('cron','manual') NOT NULL DEFAULT 'cron'
) ENGINE=InnoDB;
