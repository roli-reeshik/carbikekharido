ALTER TABLE aggregated_listings
  ADD COLUMN view_count INT NOT NULL DEFAULT 0 AFTER category;
