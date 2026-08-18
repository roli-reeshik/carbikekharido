-- Aggregated listings from external scrape sources (OLX, Cars24, etc.)

CREATE TABLE IF NOT EXISTS aggregated_listings (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  source_website VARCHAR(60) NOT NULL,
  external_id VARCHAR(120) NOT NULL,
  title VARCHAR(300) NOT NULL,
  price_inr BIGINT NOT NULL,
  location VARCHAR(200) NULL,
  mileage VARCHAR(80) NULL,
  `condition` VARCHAR(80) NULL,
  seller_name VARCHAR(120) NULL,
  listing_url VARCHAR(500) NOT NULL,
  city VARCHAR(80) NOT NULL,
  category VARCHAR(30) NOT NULL,
  last_scraped_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY aggregated_listings_source_external (source_website, external_id),
  KEY aggregated_listings_city_idx (city),
  KEY aggregated_listings_expires_idx (expires_at)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aggregated_images (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  listing_id VARCHAR(191) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  `order` INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY aggregated_images_listing_order_idx (listing_id, `order`),
  CONSTRAINT aggregated_images_listing_fk FOREIGN KEY (listing_id) REFERENCES aggregated_listings(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scrape_logs (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  level VARCHAR(20) NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'olx',
  message TEXT NOT NULL,
  meta TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY scrape_logs_created_idx (created_at),
  KEY scrape_logs_source_idx (source)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
