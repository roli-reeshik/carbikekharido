-- Seed editorial, review, and expert data. Safe to re-run (INSERT IGNORE / idempotent patterns).
-- Run: mysql -u root -p carbikedekho < db/seed_editorial.sql

SET NAMES utf8mb4;

-- Demo users for reviews (phone numbers are fictional)
INSERT IGNORE INTO users (phone, name, role) VALUES
  ('9876543210', 'Rahul Sharma', 'buyer'),
  ('9876543211', 'Priya Verma', 'buyer'),
  ('9876543212', 'Amit Patel', 'buyer'),
  ('9876543213', 'Sneha Reddy', 'buyer');

INSERT IGNORE INTO authors (id, name, bio, role) VALUES
  (1, 'Arjun Mehta', 'Senior automotive journalist covering Indian market launches since 2018.', 'journalist'),
  (2, 'Kavita Nair', 'EV specialist and long-term ownership reviewer.', 'editor'),
  (3, 'Vikram Singh', 'Two-wheeler mechanic with 15 years of workshop experience.', 'contributor');

INSERT IGNORE INTO articles (id, title, slug, excerpt, content_html, thumbnail_url, read_time_minutes,
  seo_meta_title, seo_meta_description, author_id, status, published_at) VALUES
  (1,
   'Maruti Swift 2026: Real-world mileage after 10,000 km',
   'maruti-swift-2026-real-world-mileage',
   'We tracked fuel economy across city highways and hill roads in Uttar Pradesh.',
   '<p>After 10,000 km of mixed driving, our long-term Swift VXi returned 18.4 kmpl in city traffic and 22.1 kmpl on the Lucknow–Kanpur expressway.</p><p>The 1.2L K-Series engine remains the segment benchmark for refinement, though highway overtakes above 100 kmph need planning with a full load.</p>',
   NULL, 8,
   'Maruti Swift Real-World Mileage Review 2026 | CarBikeDekho',
   'Honest long-term mileage figures for the Maruti Suzuki Swift VXi after 10,000 km of Indian driving conditions.',
   1, 'published', '2026-06-15 10:00:00'),
  (2,
   'Tata Nexon EV charging guide for first-time buyers',
   'tata-nexon-ev-charging-guide',
   'Home wallbox vs 3-pin, DC fast charging costs, and monsoon charging safety.',
   '<p>The Nexon EV Long Range supports 7.2 kW AC home charging and 50 kW DC fast charging. A full home charge from 10% costs roughly ₹280 at ₹8/unit.</p>',
   NULL, 6,
   'Tata Nexon EV Charging Guide India | CarBikeDekho',
   'Complete charging setup guide for Tata Nexon EV owners — home, public, and fast charging explained.',
   2, 'published', '2026-06-20 09:00:00'),
  (3,
   'Hero Splendor+ vs Honda Activa: commuter comparison',
   'splendor-vs-activa-commuter-comparison',
   'Which daily runner wins on mileage, maintenance, and resale in tier-2 cities?',
   '<p>Both dominate Indian roads, but their ownership profiles differ sharply. We compare 6-month running costs side by side.</p>',
   NULL, 7,
   'Splendor+ vs Activa 6G Comparison | CarBikeDekho',
   'Detailed commuter comparison between Hero Splendor+ and Honda Activa 6G for Indian buyers.',
   3, 'published', '2026-07-01 11:00:00'),
  (4,
   'Best hatchbacks under ₹10 lakh in 2026',
   'best-hatchbacks-under-10-lakh-2026',
   'Swift, i20, Baleno, and Fronx ranked on value, safety, and running cost.',
   '<p>Our buying guide ranks the top hatchbacks available in India today with NCAP ratings and 5-year TCO analysis.</p>',
   NULL, 10,
   'Best Hatchbacks Under 10 Lakh 2026 | CarBikeDekho',
   'Expert-ranked list of the best hatchback cars under Rs 10 lakh in India for 2026.',
   1, 'published', '2026-07-05 08:00:00');

-- Tag articles to brands/models
INSERT IGNORE INTO article_entity_tags (article_id, entity_type, brand_id, model_name, category_label)
SELECT 1, 'model', b.id, 'Swift', NULL FROM brands b WHERE b.name = 'Maruti Suzuki';

INSERT IGNORE INTO article_entity_tags (article_id, entity_type, brand_id, model_name, category_label)
SELECT 2, 'model', b.id, 'Nexon EV', NULL FROM brands b WHERE b.name = 'Tata Motors';

INSERT IGNORE INTO article_entity_tags (article_id, entity_type, brand_id, model_name, category_label)
SELECT 3, 'model', b.id, 'Splendor+', NULL FROM brands b WHERE b.name = 'Hero MotoCorp';

INSERT IGNORE INTO article_entity_tags (article_id, entity_type, brand_id, model_name, category_label)
SELECT 3, 'model', b.id, 'Activa 6G', NULL FROM brands b WHERE b.name = 'Honda';

INSERT IGNORE INTO article_entity_tags (article_id, entity_type, brand_id, model_name, category_label)
VALUES (4, 'category', NULL, NULL, 'Buying Guides');

-- Extra safety spec for Swift
INSERT IGNORE INTO vehicle_specs (vehicle_id, spec_key, spec_value)
SELECT v.id, 'safety_rating', '4 Star Global NCAP'
FROM vehicles v WHERE v.model_name = 'Swift' AND v.variant_name = 'VXi';

INSERT IGNORE INTO vehicle_specs (vehicle_id, spec_key, spec_value)
SELECT v.id, 'length_mm', '3840'
FROM vehicles v WHERE v.model_name = 'Swift';

INSERT IGNORE INTO vehicle_specs (vehicle_id, spec_key, spec_value)
SELECT v.id, 'width_mm', '1735'
FROM vehicles v WHERE v.model_name = 'Swift';

INSERT IGNORE INTO vehicle_specs (vehicle_id, spec_key, spec_value)
SELECT v.id, 'boot_space_litres', '268'
FROM vehicles v WHERE v.model_name = 'Swift';

-- Verified owner reviews
INSERT INTO vehicle_reviews (vehicle_id, user_id, rating, title, body, is_verified_owner, verification_ref, verified_at, status)
SELECT v.id, u.id, 5, 'Perfect city car', 'Bought in Lucknow last year. Mileage is excellent, service costs are low, and the AC cools fast even at 45°C.', TRUE, 'CBD-20250701-00012', NOW(), 'published'
FROM vehicles v, users u WHERE v.model_name = 'Swift' AND u.phone = '9876543210'
ON DUPLICATE KEY UPDATE title = title;

INSERT INTO vehicle_reviews (vehicle_id, user_id, rating, title, body, is_verified_owner, verification_ref, verified_at, status)
SELECT v.id, u.id, 4, 'Great but cramped rear', 'Front seats are comfortable. Rear is tight for 3 adults. Highway stability is good for a hatchback.', TRUE, 'CBD-20250615-00008', NOW(), 'published'
FROM vehicles v, users u WHERE v.model_name = 'Swift' AND u.phone = '9876543211';

INSERT INTO vehicle_reviews (vehicle_id, user_id, rating, title, body, is_verified_owner, verification_ref, verified_at, status)
SELECT v.id, u.id, 5, 'Best EV in the segment', 'Range is honest — I get 380-400 km in city. Home charging setup was straightforward.', TRUE, 'CBD-20250620-00015', NOW(), 'published'
FROM vehicles v, users u WHERE v.model_name = 'Nexon EV' AND u.phone = '9876543212';

INSERT INTO vehicle_reviews (vehicle_id, user_id, rating, title, body, is_verified_owner, verification_ref, verified_at, status)
SELECT v.id, u.id, 4, 'Unbeatable mileage', '65 kmpl is real in eco riding. Parts are cheap and available everywhere.', TRUE, 'REG-UP32AB1234', NOW(), 'published'
FROM vehicles v, users u WHERE v.model_name = 'Splendor+' AND u.phone = '9876543213';

-- Community Q&A
INSERT INTO vehicle_questions (vehicle_id, user_id, question_text, status)
SELECT v.id, u.id, 'What is the real mileage of Swift VXi in Lucknow city traffic?', 'answered'
FROM vehicles v, users u WHERE v.model_name = 'Swift' AND u.phone = '9876543210';

INSERT INTO vehicle_answers (question_id, user_id, answer_text, is_verified_owner)
SELECT q.id, u.id, 'I get 16-17 kmpl in peak traffic around Gomti Nagar. On open roads it easily crosses 20.', TRUE
FROM vehicle_questions q
JOIN vehicles v ON v.id = q.vehicle_id
JOIN users u ON u.phone = '9876543211'
WHERE v.model_name = 'Swift'
LIMIT 1;

-- Experts
INSERT IGNORE INTO experts (id, name, title, bio, specializations, vehicle_types, consultation_fee_inr, rating, sla_response_hours) VALUES
  (1, 'Dr. Rajesh Kulkarni', 'Automotive Engineer & Journalist',
   'Former R&D engineer at a major OEM. Specialises in powertrain analysis and NCAP safety interpretation.',
   '["Hatchbacks", "Safety ratings", "Engine tech"]', 'car', 499.00, 4.85, 24),
  (2, 'Meera Joshi', 'EV Consultant',
   'Certified EV charging infrastructure advisor. Helps buyers plan home and workplace charging.',
   '["Electric vehicles", "Charging setup", "Battery health"]', 'car', 599.00, 4.90, 12),
  (3, 'Suresh Yadav', 'Master Two-Wheeler Mechanic',
   '15 years running a multi-brand workshop in Lucknow. Expert on commuter bikes and scooters.',
   '["Commuter bikes", "Scooters", "Maintenance"]', 'bike', 299.00, 4.75, 24);

INSERT IGNORE INTO expert_brand_tags (expert_id, brand_id, vehicle_type)
SELECT 1, b.id, 'car' FROM brands b WHERE b.name = 'Maruti Suzuki';

INSERT IGNORE INTO expert_brand_tags (expert_id, brand_id, vehicle_type)
SELECT 2, b.id, 'car' FROM brands b WHERE b.name = 'Tata Motors';

INSERT IGNORE INTO expert_brand_tags (expert_id, brand_id, vehicle_type)
SELECT 3, b.id, 'bike' FROM brands b WHERE b.name = 'Hero MotoCorp';

INSERT IGNORE INTO expert_brand_tags (expert_id, brand_id, vehicle_type)
SELECT 3, b.id, 'bike' FROM brands b WHERE b.name = 'Honda';

-- Consultation slots (next 7 days, 10 AM and 4 PM IST)
INSERT INTO expert_consultation_slots (expert_id, slot_start, slot_end, status)
SELECT e.id,
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.n DAY), INTERVAL 10 HOUR),
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.n DAY), INTERVAL 10 HOUR) + INTERVAL 30 MINUTE,
  'available'
FROM experts e
CROSS JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d
WHERE e.is_active = TRUE;

INSERT INTO expert_consultation_slots (expert_id, slot_start, slot_end, status)
SELECT e.id,
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.n DAY), INTERVAL 16 HOUR),
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.n DAY), INTERVAL 16 HOUR) + INTERVAL 30 MINUTE,
  'available'
FROM experts e
CROSS JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d
WHERE e.is_active = TRUE;

-- Expert Q&A log (SLA-bound)
INSERT INTO expert_qa_log (question_id, expert_id, vehicle_id, sla_deadline, responded_at, response_text, status)
SELECT q.id, 1, v.id,
  DATE_ADD(q.created_at, INTERVAL 24 HOUR),
  DATE_ADD(q.created_at, INTERVAL 6 HOUR),
  'ARAI claims 22.38 kmpl for the Swift VXi. Real-world city figures typically land between 16-19 kmpl depending on traffic and AC usage.',
  'responded'
FROM vehicle_questions q
JOIN vehicles v ON v.id = q.vehicle_id
WHERE v.model_name = 'Swift'
LIMIT 1;
