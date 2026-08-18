-- Scraping job tracking + image quality indicator

ALTER TABLE aggregated_images
  ADD COLUMN quality INT NULL DEFAULT 80 AFTER `order`;

CREATE TABLE IF NOT EXISTS scraping_jobs (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  bull_job_id VARCHAR(120) NULL,
  job_type VARCHAR(60) NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'olx',
  city VARCHAR(80) NULL,
  category VARCHAR(30) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  listings_scraped INT NOT NULL DEFAULT 0,
  images_downloaded INT NOT NULL DEFAULT 0,
  errors_encountered INT NOT NULL DEFAULT 0,
  error_log TEXT NULL,
  started_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY scraping_jobs_bull_job_id (bull_job_id),
  KEY scraping_jobs_status_idx (status),
  KEY scraping_jobs_created_idx (created_at)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
