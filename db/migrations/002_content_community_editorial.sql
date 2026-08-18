-- =============================================================================
-- CarBikeDekho — Content, Community & Editorial Ecosystem
-- PRD Modules 7 (Reviews/Q&A), 16 (CMS/Blog), 17 (Expert Consultation)
-- Run after db/schema.sql:
--   mysql -u root -p carbikedekho < db/migrations/002_content_community_editorial.sql
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30';

-- -----------------------------------------------------------------------------
-- MODULE 16 — CMS / Editorial
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS authors (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  bio          TEXT NULL,
  avatar_url   VARCHAR(500) NULL,
  role         ENUM('journalist','editor','contributor') NOT NULL DEFAULT 'contributor',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(300) NOT NULL,
  slug                  VARCHAR(320) NOT NULL,
  excerpt               TEXT NULL,
  content_html          LONGTEXT NOT NULL,
  thumbnail_url         VARCHAR(500) NULL,
  read_time_minutes     SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  seo_meta_title        VARCHAR(300) NULL,
  seo_meta_description  VARCHAR(500) NULL,
  seo_json_ld           JSON NULL,
  author_id             BIGINT UNSIGNED NOT NULL,
  status                ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at          DATETIME NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_articles_slug (slug),
  INDEX idx_articles_status_published (status, published_at),
  CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES authors(id)
) ENGINE=InnoDB;

-- Junction: maps articles to brands, specific vehicles, or editorial categories.
CREATE TABLE IF NOT EXISTS article_entity_tags (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id      BIGINT UNSIGNED NOT NULL,
  entity_type     ENUM('brand','model','vehicle','category') NOT NULL,
  brand_id        BIGINT UNSIGNED NULL,
  vehicle_id      BIGINT UNSIGNED NULL,
  model_name      VARCHAR(150) NULL,
  category_label  VARCHAR(80) NULL,
  CONSTRAINT fk_aet_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_aet_brand   FOREIGN KEY (brand_id)   REFERENCES brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_aet_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_aet_lookup (entity_type, brand_id, vehicle_id, model_name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- MODULE 7 — Verified Owner Reviews & Community Q&A
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vehicle_reviews (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id        BIGINT UNSIGNED NOT NULL,
  user_id           BIGINT UNSIGNED NOT NULL,
  rating            TINYINT UNSIGNED NOT NULL,
  title             VARCHAR(200) NOT NULL,
  body              TEXT NOT NULL,
  is_verified_owner BOOLEAN NOT NULL DEFAULT FALSE,
  verification_ref  VARCHAR(120) NULL,
  verified_at       DATETIME NULL,
  helpful_count     INT UNSIGNED NOT NULL DEFAULT 0,
  status            ENUM('pending','published','rejected') NOT NULL DEFAULT 'pending',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vr_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_vr_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_vr_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_vr_vehicle_published (vehicle_id, status, is_verified_owner)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_questions (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id     BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  question_text  TEXT NOT NULL,
  status         ENUM('open','answered','closed') NOT NULL DEFAULT 'open',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vq_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_vq_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vq_vehicle (vehicle_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_answers (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id         BIGINT UNSIGNED NOT NULL,
  user_id             BIGINT UNSIGNED NULL,
  expert_id           BIGINT UNSIGNED NULL,
  answer_text         TEXT NOT NULL,
  is_verified_owner   BOOLEAN NOT NULL DEFAULT FALSE,
  is_expert_response  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_va_question FOREIGN KEY (question_id) REFERENCES vehicle_questions(id) ON DELETE CASCADE,
  INDEX idx_va_question (question_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- MODULE 17 — Expert Consultation Layer
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS experts (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(120) NOT NULL,
  title                 VARCHAR(150) NOT NULL,
  bio                   TEXT NULL,
  avatar_url            VARCHAR(500) NULL,
  specializations       JSON NOT NULL,
  vehicle_types         SET('car','bike') NOT NULL,
  consultation_fee_inr  DECIMAL(10,2) NOT NULL DEFAULT 0,
  rating                DECIMAL(3,2) NOT NULL DEFAULT 4.50,
  sla_response_hours    SMALLINT UNSIGNED NOT NULL DEFAULT 24,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expert_brand_tags (
  expert_id     BIGINT UNSIGNED NOT NULL,
  brand_id      BIGINT UNSIGNED NULL,
  vehicle_type  ENUM('car','bike') NOT NULL,
  PRIMARY KEY (expert_id, vehicle_type, brand_id),
  CONSTRAINT fk_ebt_expert FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ebt_brand  FOREIGN KEY (brand_id)  REFERENCES brands(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expert_consultation_slots (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expert_id   BIGINT UNSIGNED NOT NULL,
  slot_start  DATETIME NOT NULL,
  slot_end    DATETIME NOT NULL,
  status      ENUM('available','booked','cancelled') NOT NULL DEFAULT 'available',
  CONSTRAINT fk_ecs_expert FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_ecs_expert_available (expert_id, status, slot_start)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expert_consultation_bookings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expert_id     BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  vehicle_id    BIGINT UNSIGNED NULL,
  slot_id       BIGINT UNSIGNED NOT NULL,
  meeting_type  ENUM('voice','video') NOT NULL DEFAULT 'voice',
  status        ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ecb_expert  FOREIGN KEY (expert_id)  REFERENCES experts(id),
  CONSTRAINT fk_ecb_user    FOREIGN KEY (user_id)    REFERENCES users(id),
  CONSTRAINT fk_ecb_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_ecb_slot    FOREIGN KEY (slot_id)    REFERENCES expert_consultation_slots(id)
) ENGINE=InnoDB;

-- SLA-bound expert response log tied to community questions.
CREATE TABLE IF NOT EXISTS expert_qa_log (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id    BIGINT UNSIGNED NOT NULL,
  expert_id      BIGINT UNSIGNED NOT NULL,
  vehicle_id     BIGINT UNSIGNED NOT NULL,
  sla_deadline   DATETIME NOT NULL,
  responded_at   DATETIME NULL,
  response_text  TEXT NULL,
  status         ENUM('pending','responded','breached') NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_eql_question FOREIGN KEY (question_id) REFERENCES vehicle_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_eql_expert   FOREIGN KEY (expert_id)   REFERENCES experts(id),
  CONSTRAINT fk_eql_vehicle  FOREIGN KEY (vehicle_id)  REFERENCES vehicles(id),
  INDEX idx_eql_vehicle (vehicle_id, status)
) ENGINE=InnoDB;
