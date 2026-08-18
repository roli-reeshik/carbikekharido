CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  type VARCHAR(60) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'warning',
  message VARCHAR(500) NOT NULL,
  details TEXT NULL,
  channels VARCHAR(120) NULL,
  acknowledged TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  acknowledged_at DATETIME(3) NULL,
  KEY monitoring_alerts_ack_created_idx (acknowledged, created_at),
  KEY monitoring_alerts_type_created_idx (type, created_at)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
