-- Supabase Storage setup for CarBikeDekho listing media
-- Run via Supabase Dashboard → Storage, or SQL editor where supported.

-- 1. Create public bucket (Dashboard → Storage → New bucket)
--    Name: vehicle-listings
--    Public: true

-- 2. Example storage policies (Storage → Policies → vehicle-listings)

-- Public read (CDN-backed public URLs)
-- Policy name: Public read listings
-- Operation: SELECT
-- Target roles: public
-- USING expression:
--   bucket_id = 'vehicle-listings'

-- Authenticated upload to own folder (optional if using service role on server)
-- Policy name: Users upload own listings
-- Operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression:
--   bucket_id = 'vehicle-listings'
--   AND (storage.foldername(name))[1] = 'listings'
--   AND auth.uid()::text = (storage.foldername(name))[2]

-- Object path layout:
--   listings/{userId}/{listingId}/{order}.webp       — full image (WebP, 80% quality)
--   listings/{userId}/{listingId}/{order}-thumb.webp   — thumbnail (200×150)
--   listings/{userId}/{listingId}/{order}.mp4|.webm    — videos
