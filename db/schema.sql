-- =============================================================================
-- CarBikeDekho.com — Core MySQL Schema
-- Target: MySQL 8.x / MariaDB 10.6+ installed locally
-- =============================================================================
-- Design notes:
--  - One unified `vehicles` catalog table for BOTH cars and bikes, with a
--    `vehicle_type` discriminator column — per the PRD's convention
--    ("one system serving both", not parallel car/bike table sets).
--  - Anonymous-first: `users` rows are created lazily, only when a visitor
--    completes OTP verification for the first time (an intent action).
--    Nothing here requires a user row to exist for browsing/catalog/wishlist
--    (wishlist stays client-side until an account exists — see app code).
--  - `otp_verifications` gives OTP a durable, auditable home instead of
--    process memory — required now that this is a real backend.
--  - `orders` / `transactions` / `order_status_history` are the system of
--    record for any purchase (new or used, car or bike). Payment gateway
--    integration writes to `transactions`; it never needs its own parallel
--    tables — same instruction as "no API hell": one settlement model
--    reused for every payment type (booking amount, full payment, EMI
--    down payment, escrow release).
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30'; -- IST, since this is an India-only marketplace

-- -----------------------------------------------------------------------------
-- 1. USERS & IDENTITY  (PRD Module 1)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone             VARCHAR(10)     NOT NULL,               -- 10-digit Indian mobile, no country code
  name              VARCHAR(120)    NULL,
  email             VARCHAR(190)    NULL,
  role              ENUM('buyer','seller','dealer','admin') NOT NULL DEFAULT 'buyer',
  kyc_status        ENUM('none','pending','verified','rejected') NOT NULL DEFAULT 'none',
  kyc_provider_ref  VARCHAR(120)    NULL,                    -- DigiLocker/Aadhaar e-KYC reference, only when kyc_status != 'none'
  preferred_locale  ENUM('en','hi') NOT NULL DEFAULT 'en',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB;

-- Dealer/business KYC stays a distinct, deliberate flow (per Module 1) —
-- separate table rather than overloading `users`, since it has its own
-- approval workflow and fields a consumer account never needs.
CREATE TABLE IF NOT EXISTS dealer_profiles (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT UNSIGNED NOT NULL,
  business_name       VARCHAR(200)    NOT NULL,
  gstin               VARCHAR(15)     NOT NULL,
  trade_license_ref   VARCHAR(120)    NULL,
  approval_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approved_by_admin_id BIGINT UNSIGNED NULL,
  city_id             BIGINT UNSIGNED NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dealer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_dealer_gstin (gstin)
) ENGINE=InnoDB;

-- OTP verification, durable and auditable (replaces the in-memory demo store).
CREATE TABLE IF NOT EXISTS otp_verifications (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone        VARCHAR(10)  NOT NULL,
  otp_hash     CHAR(64)     NOT NULL,      -- SHA-256 of the code; never store the raw OTP
  purpose      ENUM('registration','login','sensitive_action') NOT NULL DEFAULT 'registration',
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at   DATETIME     NOT NULL,
  consumed_at  DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone_active (phone, consumed_at, expires_at)
) ENGINE=InnoDB;

-- One row per verified session (server-side, replaces the demo client token).
CREATE TABLE IF NOT EXISTS sessions (
  id            CHAR(36)     NOT NULL PRIMARY KEY,           -- UUID
  user_id       BIGINT UNSIGNED NOT NULL,
  issued_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME     NOT NULL,
  revoked_at    DATETIME     NULL,
  device_label  VARCHAR(120) NULL,                           -- optional, for "manage devices" (Module 1, Could-have)
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB;

-- Per-dealer, per-listing lead consent (PRD Module 9 — differentiator).
-- This is the auditable log the user-facing "who has my contact info"
-- screen reads from, and the row a "stop contacting me" action updates.
CREATE TABLE IF NOT EXISTS lead_consents (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  dealer_id       BIGINT UNSIGNED NOT NULL,
  vehicle_id      BIGINT UNSIGNED NULL,                      -- nullable: consent can be listing-specific or general
  intent_action   VARCHAR(60)  NOT NULL,                     -- matches IntentAction values from src/lib/intent.ts
  granted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at      DATETIME     NULL,
  CONSTRAINT fk_lead_user   FOREIGN KEY (user_id)   REFERENCES users(id)            ON DELETE CASCADE,
  CONSTRAINT fk_lead_dealer FOREIGN KEY (dealer_id) REFERENCES dealer_profiles(id)  ON DELETE CASCADE,
  INDEX idx_lead_user (user_id),
  INDEX idx_lead_dealer_active (dealer_id, revoked_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. LOCATION & CATALOG  (PRD Module 2 — cars & bikes, one system)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cities (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  rto_zone    VARCHAR(20)  NULL,                              -- feeds the on-road price engine's RTO-tax lookup
  UNIQUE KEY uq_city_state (name, state)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS brands (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  vehicle_type ENUM('car','bike','both') NOT NULL DEFAULT 'both',
  logo_url     VARCHAR(300) NULL,
  UNIQUE KEY uq_brand_name (name)
) ENGINE=InnoDB;

-- One catalog for cars AND bikes. Type-specific attributes (engine cc,
-- ADAS, seating, etc.) live in `vehicle_specs` as flexible key/value rows
-- rather than as sparse nullable columns on this table, so adding a new
-- attribute never requires an ALTER TABLE.
CREATE TABLE IF NOT EXISTS vehicles (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_type       ENUM('car','bike') NOT NULL,
  brand_id           BIGINT UNSIGNED NOT NULL,
  model_name         VARCHAR(150) NOT NULL,
  variant_name       VARCHAR(150) NOT NULL,
  fuel_type          ENUM('petrol','diesel','electric','cng','hybrid') NOT NULL,
  ex_showroom_price  DECIMAL(12,2) NOT NULL,
  is_upcoming        BOOLEAN NOT NULL DEFAULT FALSE,
  launch_confidence  ENUM('confirmed','expected','rumoured') NULL,   -- only meaningful when is_upcoming = TRUE
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicle_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  INDEX idx_vehicle_type_brand (vehicle_type, brand_id)
) ENGINE=InnoDB;

-- Flexible spec attributes: e.g. ("seating_capacity","5"), ("engine_cc","110"),
-- ("has_adas","true"), ("mileage_kmpl","45"). Keeps Module 2's filter engine
-- data-driven instead of schema-driven.
CREATE TABLE IF NOT EXISTS vehicle_specs (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id   BIGINT UNSIGNED NOT NULL,
  spec_key     VARCHAR(60)  NOT NULL,
  spec_value   VARCHAR(200) NOT NULL,
  CONSTRAINT fk_spec_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_vehicle_spec (vehicle_id, spec_key)
) ENGINE=InnoDB;

-- Real photos for a vehicle (S3-hosted, or wherever your bucket lives).
-- Absence of rows for a vehicle_id means "no photo uploaded yet" — the
-- API layer (see src/lib/db/vehiclesRepo.ts) returns a placeholder path
-- in that case rather than an empty gallery. This is the same
-- "manifest of what's actually photographed" concept from the earlier
-- standalone Indian-vehicle demo, now backed by a real table instead of
-- an in-memory Set.
CREATE TABLE IF NOT EXISTS vehicle_images (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id   BIGINT UNSIGNED NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicle_image_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_images_vehicle (vehicle_id, sort_order)
) ENGINE=InnoDB;


-- engine (kept as data, not calculated ad hoc in application code, so the
-- "updated within 24 hours of a price change" acceptance criterion is just
-- a scheduled job writing to this table).
CREATE TABLE IF NOT EXISTS on_road_prices (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id        BIGINT UNSIGNED NOT NULL,
  city_id           BIGINT UNSIGNED NOT NULL,
  rto_tax           DECIMAL(12,2) NOT NULL,
  insurance_amount  DECIMAL(12,2) NOT NULL,
  accessories_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  on_road_total     DECIMAL(12,2) NOT NULL,
  effective_from    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orp_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_orp_city    FOREIGN KEY (city_id)    REFERENCES cities(id),
  UNIQUE KEY uq_orp_vehicle_city (vehicle_id, city_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. USED VEHICLE MARKETPLACE  (PRD Module 4)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS used_vehicle_listings (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_user_id   BIGINT UNSIGNED NOT NULL,
  vehicle_type     ENUM('car','bike') NOT NULL,
  brand_id         BIGINT UNSIGNED NOT NULL,
  model_name       VARCHAR(150) NOT NULL,
  registration_year YEAR NOT NULL,
  chassis_number   VARCHAR(40)  NULL,                        -- used by Module 20's history report lookup
  odometer_km      INT UNSIGNED NOT NULL,
  owner_count      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  asking_price     DECIMAL(12,2) NOT NULL,
  ai_valuation     DECIMAL(12,2) NULL,                        -- Module 4's instant valuation tool output
  city_id          BIGINT UNSIGNED NOT NULL,
  status           ENUM('draft','active','under_inspection','sold','withdrawn') NOT NULL DEFAULT 'draft',
  certified         BOOLEAN NOT NULL DEFAULT FALSE,           -- 217-point (car) / bike checklist inspection completed
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_uvl_seller FOREIGN KEY (seller_user_id) REFERENCES users(id),
  CONSTRAINT fk_uvl_brand  FOREIGN KEY (brand_id)       REFERENCES brands(id),
  CONSTRAINT fk_uvl_city   FOREIGN KEY (city_id)        REFERENCES cities(id),
  INDEX idx_uvl_type_status (vehicle_type, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inspection_reports (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id        BIGINT UNSIGNED NOT NULL,
  inspector_ref     VARCHAR(120) NULL,
  overall_grade     ENUM('A','B','C','D') NULL,
  report_url        VARCHAR(300) NULL,
  completed_at      DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inspection_listing FOREIGN KEY (listing_id) REFERENCES used_vehicle_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. WISHLIST (account-linked — merged in from the anonymous/local list
--    the instant a user verifies; see mergeWishlistIntoAccount() in app code)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wishlists (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  vehicle_id   BIGINT UNSIGNED NULL,       -- new-vehicle catalog wishlist item
  listing_id   BIGINT UNSIGNED NULL,       -- used-vehicle listing wishlist item
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlist_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_listing FOREIGN KEY (listing_id) REFERENCES used_vehicle_listings(id) ON DELETE CASCADE,
  CONSTRAINT chk_wishlist_target CHECK (
    (vehicle_id IS NOT NULL AND listing_id IS NULL) OR
    (vehicle_id IS NULL AND listing_id IS NOT NULL)
  ),
  UNIQUE KEY uq_wishlist_user_vehicle (user_id, vehicle_id),
  UNIQUE KEY uq_wishlist_user_listing (user_id, listing_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. ORDERS & TRANSACTIONS — the part this task is really about
-- -----------------------------------------------------------------------------

-- One order per purchase intent — a new-vehicle booking, a used-vehicle
-- purchase, or (later) a trade-in-adjusted purchase (Module 18). Deliberately
-- one `orders` table for every purchase type rather than separate
-- new-car-orders / used-car-orders / bike-orders tables — same "no API hell"
-- discipline applied to schema design: one system, a type column.
CREATE TABLE IF NOT EXISTS orders (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number        VARCHAR(24)  NOT NULL,                 -- human-readable, e.g. CBD-20260712-00042
  buyer_user_id       BIGINT UNSIGNED NOT NULL,
  order_type          ENUM('new_vehicle_booking','used_vehicle_purchase') NOT NULL,
  vehicle_id          BIGINT UNSIGNED NULL,                  -- set when order_type = new_vehicle_booking
  listing_id          BIGINT UNSIGNED NULL,                  -- set when order_type = used_vehicle_purchase
  dealer_id           BIGINT UNSIGNED NULL,                  -- selling dealer, for new_vehicle_booking
  city_id             BIGINT UNSIGNED NOT NULL,
  quoted_on_road_price DECIMAL(12,2) NOT NULL,
  trade_in_credit     DECIMAL(12,2) NOT NULL DEFAULT 0,       -- Module 18 — trade-in value offsetting this order
  amount_payable      DECIMAL(12,2) NOT NULL,                 -- quoted_on_road_price - trade_in_credit
  status              ENUM(
                        'created',            -- order placed, no payment yet
                        'payment_pending',     -- payment initiated at the gateway
                        'paid',                -- payment confirmed
                        'confirmed',           -- dealer/seller confirmed the sale
                        'delivered',
                        'cancelled',
                        'refunded'
                      ) NOT NULL DEFAULT 'created',
  price_locked_until  DATETIME NULL,                          -- Module 5's price-lock guarantee
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_buyer   FOREIGN KEY (buyer_user_id) REFERENCES users(id),
  CONSTRAINT fk_order_vehicle FOREIGN KEY (vehicle_id)    REFERENCES vehicles(id),
  CONSTRAINT fk_order_listing FOREIGN KEY (listing_id)    REFERENCES used_vehicle_listings(id),
  CONSTRAINT fk_order_dealer  FOREIGN KEY (dealer_id)     REFERENCES dealer_profiles(id),
  CONSTRAINT fk_order_city    FOREIGN KEY (city_id)       REFERENCES cities(id),
  CONSTRAINT chk_order_target CHECK (
    (order_type = 'new_vehicle_booking'  AND vehicle_id IS NOT NULL AND listing_id IS NULL) OR
    (order_type = 'used_vehicle_purchase' AND listing_id IS NOT NULL AND vehicle_id IS NULL)
  ),
  UNIQUE KEY uq_order_number (order_number),
  INDEX idx_order_buyer (buyer_user_id),
  INDEX idx_order_status (status)
) ENGINE=InnoDB;

-- Every status change is appended here — this is what Module 13 (Trust &
-- Safety / SLA-bound dispute resolution) and the buyer's order-tracking
-- screen both read from, instead of only trusting the current `orders.status`.
CREATE TABLE IF NOT EXISTS order_status_history (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     BIGINT UNSIGNED NOT NULL,
  from_status  VARCHAR(30) NULL,
  to_status    VARCHAR(30) NOT NULL,
  changed_by   ENUM('system','buyer','dealer','admin') NOT NULL DEFAULT 'system',
  note         VARCHAR(300) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- One settlement model for every payment event on an order: booking amount,
-- full payment, EMI down payment, or an escrow release for a used-vehicle
-- purchase (Module 4). The payment gateway webhook writes here; nothing
-- else in the app needs its own parallel "payments" concept.
CREATE TABLE IF NOT EXISTS transactions (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id            BIGINT UNSIGNED NOT NULL,
  transaction_type    ENUM('booking_amount','full_payment','emi_down_payment','escrow_hold','escrow_release','refund') NOT NULL,
  amount              DECIMAL(12,2) NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'INR',
  gateway              VARCHAR(40)  NULL,                     -- e.g. 'razorpay', 'cashfree' — swap without a schema change
  gateway_reference    VARCHAR(120) NULL,                     -- gateway's own transaction/payment id
  status               ENUM('initiated','success','failed','reversed') NOT NULL DEFAULT 'initiated',
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_txn_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_txn_order (order_id),
  INDEX idx_txn_gateway_ref (gateway, gateway_reference)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Helpful composite view: an order with its latest transaction status,
-- used by the buyer's "My Orders" screen and admin dashboards alike so
-- that query isn't hand-rolled in application code more than once.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
  o.id,
  o.order_number,
  o.buyer_user_id,
  o.order_type,
  o.status AS order_status,
  o.amount_payable,
  t.status AS latest_transaction_status,
  t.transaction_type AS latest_transaction_type,
  t.created_at AS latest_transaction_at
FROM orders o
LEFT JOIN transactions t
  ON t.id = (
    SELECT t2.id FROM transactions t2
    WHERE t2.order_id = o.id
    ORDER BY t2.created_at DESC
    LIMIT 1
  );
