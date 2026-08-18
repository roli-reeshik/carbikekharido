-- Minimal seed data for local development. Safe to re-run (uses INSERT IGNORE).

INSERT IGNORE INTO cities (name, state, rto_zone) VALUES
  ('Lucknow', 'Uttar Pradesh', 'UP32'),
  ('Delhi', 'Delhi', 'DL'),
  ('Bengaluru', 'Karnataka', 'KA');

INSERT IGNORE INTO brands (name, vehicle_type) VALUES
  ('Maruti Suzuki', 'car'),
  ('Tata Motors', 'both'),
  ('Hero MotoCorp', 'bike'),
  ('Honda', 'both');

-- Vehicles: two cars, two bikes, tied to the brands above.
INSERT INTO vehicles (vehicle_type, brand_id, model_name, variant_name, fuel_type, ex_showroom_price)
SELECT 'car', id, 'Swift', 'VXi', 'petrol', 649000 FROM brands WHERE name = 'Maruti Suzuki'
UNION ALL
SELECT 'car', id, 'Nexon EV', 'Long Range', 'electric', 1499000 FROM brands WHERE name = 'Tata Motors'
UNION ALL
SELECT 'bike', id, 'Splendor+', 'Standard', 'petrol', 79500 FROM brands WHERE name = 'Hero MotoCorp'
UNION ALL
SELECT 'bike', id, 'Activa 6G', 'Standard', 'petrol', 74000 FROM brands WHERE name = 'Honda';

-- A sample on-road price row for the Swift in Lucknow.
INSERT INTO on_road_prices (vehicle_id, city_id, rto_tax, insurance_amount, accessories_amount, on_road_total)
SELECT v.id, c.id, 65000, 35000, 15000, v.ex_showroom_price + 65000 + 35000 + 15000
FROM vehicles v, cities c
WHERE v.model_name = 'Swift' AND c.name = 'Lucknow'
LIMIT 1;

-- Vehicle specs — the flexible key/value attributes the vehicle-details
-- page reads (Module 2's filter engine also reads from this same table).
-- araiMileageUnit is explicit ("kmpl" vs "km/charge") rather than assumed,
-- since EVs and ICE vehicles report range differently.
INSERT INTO vehicle_specs (vehicle_id, spec_key, spec_value)
SELECT v.id, spec.spec_key, spec.spec_value
FROM vehicles v
CROSS JOIN (
  SELECT 'Swift' AS model_name, 'ground_clearance_mm' AS spec_key, '163' AS spec_value
  UNION ALL SELECT 'Swift', 'arai_mileage', '22.38'
  UNION ALL SELECT 'Swift', 'arai_mileage_unit', 'kmpl'
  UNION ALL SELECT 'Swift', 'seating_capacity', '5'
  UNION ALL SELECT 'Swift', 'transmission', 'Manual'
  UNION ALL SELECT 'Swift', 'displacement_cc', '1197'
  UNION ALL SELECT 'Nexon EV', 'ground_clearance_mm', '190'
  UNION ALL SELECT 'Nexon EV', 'arai_mileage', '489'
  UNION ALL SELECT 'Nexon EV', 'arai_mileage_unit', 'km/charge'
  UNION ALL SELECT 'Nexon EV', 'seating_capacity', '5'
  UNION ALL SELECT 'Nexon EV', 'transmission', 'Automatic'
  UNION ALL SELECT 'Splendor+', 'ground_clearance_mm', '166'
  UNION ALL SELECT 'Splendor+', 'arai_mileage', '65'
  UNION ALL SELECT 'Splendor+', 'arai_mileage_unit', 'kmpl'
  UNION ALL SELECT 'Splendor+', 'seating_capacity', '2'
  UNION ALL SELECT 'Splendor+', 'transmission', 'Manual'
  UNION ALL SELECT 'Splendor+', 'displacement_cc', '97'
  UNION ALL SELECT 'Activa 6G', 'ground_clearance_mm', '163'
  UNION ALL SELECT 'Activa 6G', 'arai_mileage', '60'
  UNION ALL SELECT 'Activa 6G', 'arai_mileage_unit', 'kmpl'
  UNION ALL SELECT 'Activa 6G', 'seating_capacity', '2'
  UNION ALL SELECT 'Activa 6G', 'transmission', 'Automatic'
  UNION ALL SELECT 'Activa 6G', 'displacement_cc', '109'
) AS spec
WHERE v.model_name = spec.model_name;

-- Images — deliberately only for Swift and Splendor+, leaving Nexon EV
-- and Activa 6G without rows so the placeholder-fallback path in
-- vehiclesRepo.ts has something real to exercise, same as the earlier
-- standalone demo's manifest.
INSERT INTO vehicle_images (vehicle_id, image_url, sort_order)
SELECT v.id, img.image_url, img.sort_order
FROM vehicles v
CROSS JOIN (
  SELECT 'Swift' AS model_name, 'https://my-indian-portal-assets.s3.ap-south-1.amazonaws.com/vehicles/maruti-suzuki-swift-vxi-front.webp' AS image_url, 0 AS sort_order
  UNION ALL SELECT 'Swift', 'https://my-indian-portal-assets.s3.ap-south-1.amazonaws.com/vehicles/maruti-suzuki-swift-vxi-side.webp', 1
  UNION ALL SELECT 'Splendor+', 'https://my-indian-portal-assets.s3.ap-south-1.amazonaws.com/vehicles/hero-splendor-plus-front.webp', 0
) AS img
WHERE v.model_name = img.model_name;
