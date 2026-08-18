-- CarBikeDekho logical backup
-- Generated: 2026-07-28T13:39:54.853Z
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `aggregator_sync_runs`;
CREATE TABLE `aggregator_sync_runs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('running','success','partial','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'running',
  `vehicles_processed` int unsigned NOT NULL DEFAULT '0',
  `images_processed` int unsigned NOT NULL DEFAULT '0',
  `offers_processed` int unsigned NOT NULL DEFAULT '0',
  `errors_count` int unsigned NOT NULL DEFAULT '0',
  `error_log` text COLLATE utf8mb4_unicode_ci,
  `trigger_source` enum('cron','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cron',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `aggregator_sync_runs` (`id`, `started_at`, `completed_at`, `status`, `vehicles_processed`, `images_processed`, `offers_processed`, `errors_count`, `error_log`, `trigger_source`) VALUES (1, '2026-07-13 12:56:33', '2026-07-13 12:56:35', 'success', 4, 0, 3, 0, NULL, 'cron');
INSERT INTO `aggregator_sync_runs` (`id`, `started_at`, `completed_at`, `status`, `vehicles_processed`, `images_processed`, `offers_processed`, `errors_count`, `error_log`, `trigger_source`) VALUES (2, '2026-07-13 12:57:01', '2026-07-13 12:57:02', 'success', 4, 0, 3, 0, NULL, 'cron');
INSERT INTO `aggregator_sync_runs` (`id`, `started_at`, `completed_at`, `status`, `vehicles_processed`, `images_processed`, `offers_processed`, `errors_count`, `error_log`, `trigger_source`) VALUES (3, '2026-07-13 13:00:04', '2026-07-13 13:00:15', 'success', 4, 4, 3, 0, NULL, 'cron');
INSERT INTO `aggregator_sync_runs` (`id`, `started_at`, `completed_at`, `status`, `vehicles_processed`, `images_processed`, `offers_processed`, `errors_count`, `error_log`, `trigger_source`) VALUES (4, '2026-07-13 13:00:33', '2026-07-13 13:00:41', 'success', 4, 4, 3, 0, NULL, 'cron');

DROP TABLE IF EXISTS `article_entity_tags`;
CREATE TABLE `article_entity_tags` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `article_id` bigint unsigned NOT NULL,
  `entity_type` enum('brand','model','vehicle','category') COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` bigint unsigned DEFAULT NULL,
  `vehicle_id` bigint unsigned DEFAULT NULL,
  `model_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_label` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_aet_article` (`article_id`),
  KEY `fk_aet_brand` (`brand_id`),
  KEY `fk_aet_vehicle` (`vehicle_id`),
  KEY `idx_aet_lookup` (`entity_type`,`brand_id`,`vehicle_id`,`model_name`),
  CONSTRAINT `fk_aet_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aet_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_aet_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(320) COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text COLLATE utf8mb4_unicode_ci,
  `content_html` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `read_time_minutes` smallint unsigned NOT NULL DEFAULT '5',
  `seo_meta_title` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seo_meta_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seo_json_ld` json DEFAULT NULL,
  `author_id` bigint unsigned NOT NULL,
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_articles_slug` (`slug`),
  KEY `idx_articles_status_published` (`status`,`published_at`),
  KEY `fk_articles_author` (`author_id`),
  CONSTRAINT `fk_articles_author` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `authors`;
CREATE TABLE `authors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('journalist','editor','contributor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contributor',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type` enum('car','bike','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both',
  `logo_url` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_brand_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `brands` (`id`, `name`, `vehicle_type`, `logo_url`) VALUES (1, 'Maruti Suzuki', 'car', NULL);
INSERT INTO `brands` (`id`, `name`, `vehicle_type`, `logo_url`) VALUES (2, 'Tata Motors', 'both', NULL);
INSERT INTO `brands` (`id`, `name`, `vehicle_type`, `logo_url`) VALUES (3, 'Hero MotoCorp', 'bike', NULL);
INSERT INTO `brands` (`id`, `name`, `vehicle_type`, `logo_url`) VALUES (4, 'Honda', 'both', NULL);

DROP TABLE IF EXISTS `cities`;
CREATE TABLE `cities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rto_zone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_city_state` (`name`,`state`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cities` (`id`, `name`, `state`, `rto_zone`) VALUES (1, 'Lucknow', 'Uttar Pradesh', 'UP32');
INSERT INTO `cities` (`id`, `name`, `state`, `rto_zone`) VALUES (2, 'Delhi', 'Delhi', 'DL');
INSERT INTO `cities` (`id`, `name`, `state`, `rto_zone`) VALUES (3, 'Bengaluru', 'Karnataka', 'KA');

DROP TABLE IF EXISTS `dealer_profiles`;
CREATE TABLE `dealer_profiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `business_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gstin` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trade_license_ref` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by_admin_id` bigint unsigned DEFAULT NULL,
  `city_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dealer_gstin` (`gstin`),
  KEY `fk_dealer_user` (`user_id`),
  CONSTRAINT `fk_dealer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `experts`;
CREATE TABLE `experts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specializations` json NOT NULL,
  `vehicle_types` set('car','bike') COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultation_fee_inr` decimal(10,2) NOT NULL DEFAULT '0.00',
  `rating` decimal(3,2) NOT NULL DEFAULT '4.50',
  `sla_response_hours` smallint unsigned NOT NULL DEFAULT '24',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inspection_reports`;
CREATE TABLE `inspection_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` bigint unsigned NOT NULL,
  `inspector_ref` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `overall_grade` enum('A','B','C','D') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_url` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_inspection_listing` (`listing_id`),
  CONSTRAINT `fk_inspection_listing` FOREIGN KEY (`listing_id`) REFERENCES `used_vehicle_listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lead_consents`;
CREATE TABLE `lead_consents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `dealer_id` bigint unsigned NOT NULL,
  `vehicle_id` bigint unsigned DEFAULT NULL,
  `intent_action` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lead_user` (`user_id`),
  KEY `idx_lead_dealer_active` (`dealer_id`,`revoked_at`),
  CONSTRAINT `fk_lead_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `dealer_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lead_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `on_road_prices`;
CREATE TABLE `on_road_prices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint unsigned NOT NULL,
  `city_id` bigint unsigned NOT NULL,
  `rto_tax` decimal(12,2) NOT NULL,
  `insurance_amount` decimal(12,2) NOT NULL,
  `accessories_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `on_road_total` decimal(12,2) NOT NULL,
  `effective_from` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orp_vehicle_city` (`vehicle_id`,`city_id`),
  KEY `fk_orp_city` (`city_id`),
  CONSTRAINT `fk_orp_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `fk_orp_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `on_road_prices` (`id`, `vehicle_id`, `city_id`, `rto_tax`, `insurance_amount`, `accessories_amount`, `on_road_total`, `effective_from`) VALUES (1, 1, 1, '65000.00', '35000.00', '15000.00', '764000.00', '2026-07-13 12:56:20');

DROP TABLE IF EXISTS `order_status_history`;
CREATE TABLE `order_status_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `from_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` enum('system','buyer','dealer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `note` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_osh_order` (`order_id`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
  `buyer_user_id` bigint unsigned NOT NULL,
  `order_type` enum('new_vehicle_booking','used_vehicle_purchase') COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` bigint unsigned DEFAULT NULL,
  `listing_id` bigint unsigned DEFAULT NULL,
  `dealer_id` bigint unsigned DEFAULT NULL,
  `city_id` bigint unsigned NOT NULL,
  `quoted_on_road_price` decimal(12,2) NOT NULL,
  `trade_in_credit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_payable` decimal(12,2) NOT NULL,
  `status` enum('created','payment_pending','paid','confirmed','delivered','cancelled','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'created',
  `price_locked_until` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_number` (`order_number`),
  KEY `fk_order_vehicle` (`vehicle_id`),
  KEY `fk_order_listing` (`listing_id`),
  KEY `fk_order_dealer` (`dealer_id`),
  KEY `fk_order_city` (`city_id`),
  KEY `idx_order_buyer` (`buyer_user_id`),
  KEY `idx_order_status` (`status`),
  CONSTRAINT `fk_order_buyer` FOREIGN KEY (`buyer_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_order_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `fk_order_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `dealer_profiles` (`id`),
  CONSTRAINT `fk_order_listing` FOREIGN KEY (`listing_id`) REFERENCES `used_vehicle_listings` (`id`),
  CONSTRAINT `fk_order_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  CONSTRAINT `chk_order_target` CHECK ((((`order_type` = _utf8mb4'new_vehicle_booking') and (`vehicle_id` is not null) and (`listing_id` is null)) or ((`order_type` = _utf8mb4'used_vehicle_purchase') and (`listing_id` is not null) and (`vehicle_id` is null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `otp_verifications`;
CREATE TABLE `otp_verifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phone` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('registration','login','sensitive_action') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registration',
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_phone_active` (`phone`,`consumed_at`,`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `issued_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `device_label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user` (`user_id`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `transaction_type` enum('booking_amount','full_payment','emi_down_payment','escrow_hold','escrow_release','refund') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `gateway` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_reference` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('initiated','success','failed','reversed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_txn_order` (`order_id`),
  KEY `idx_txn_gateway_ref` (`gateway`,`gateway_reference`),
  CONSTRAINT `fk_txn_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `used_vehicle_listings`;
CREATE TABLE `used_vehicle_listings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `seller_user_id` bigint unsigned NOT NULL,
  `vehicle_type` enum('car','bike') COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` bigint unsigned NOT NULL,
  `model_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_year` year NOT NULL,
  `chassis_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `odometer_km` int unsigned NOT NULL,
  `owner_count` tinyint unsigned NOT NULL DEFAULT '1',
  `asking_price` decimal(12,2) NOT NULL,
  `ai_valuation` decimal(12,2) DEFAULT NULL,
  `city_id` bigint unsigned NOT NULL,
  `status` enum('draft','active','under_inspection','sold','withdrawn') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `certified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_uvl_seller` (`seller_user_id`),
  KEY `fk_uvl_brand` (`brand_id`),
  KEY `fk_uvl_city` (`city_id`),
  KEY `idx_uvl_type_status` (`vehicle_type`,`status`),
  CONSTRAINT `fk_uvl_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `fk_uvl_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `fk_uvl_seller` FOREIGN KEY (`seller_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phone` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('buyer','seller','dealer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'buyer',
  `kyc_status` enum('none','pending','verified','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `kyc_provider_ref` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_locale` enum('en','hi') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `v_order_summary`;
undefined;

DROP TABLE IF EXISTS `vehicle_answers`;
CREATE TABLE `vehicle_answers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `question_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `expert_id` bigint unsigned DEFAULT NULL,
  `answer_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified_owner` tinyint(1) NOT NULL DEFAULT '0',
  `is_expert_response` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_va_question` (`question_id`),
  CONSTRAINT `fk_va_question` FOREIGN KEY (`question_id`) REFERENCES `vehicle_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vehicle_images`;
CREATE TABLE `vehicle_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint unsigned NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `source` enum('aggregator','manual','legacy') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'legacy',
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_images_vehicle` (`vehicle_id`,`sort_order`),
  CONSTRAINT `fk_vehicle_image_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `image_url`, `sort_order`, `created_at`, `source`, `storage_key`) VALUES (1, 1, 'https://my-indian-portal-assets.s3.ap-south-1.amazonaws.com/vehicles/maruti-suzuki-swift-vxi-side.webp', 1, '2026-07-13 12:56:20', 'legacy', NULL);
INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `image_url`, `sort_order`, `created_at`, `source`, `storage_key`) VALUES (2, 1, 'https://my-indian-portal-assets.s3.ap-south-1.amazonaws.com/vehicles/maruti-suzuki-swift-vxi-front.webp', 0, '2026-07-13 12:56:20', 'legacy', NULL);
INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `image_url`, `sort_order`, `created_at`, `source`, `storage_key`) VALUES (3, 3, 'https://my-indian-portal-assets.s3.ap-south-1.amazonaws.com/vehicles/hero-splendor-plus-front.webp', 0, '2026-07-13 12:56:20', 'legacy', NULL);
INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `image_url`, `sort_order`, `created_at`, `source`, `storage_key`) VALUES (8, 1, '/uploads/vehicles/maruti-suzuki-swift-vxi-2026/1783947636875-0.webp', 0, '2026-07-13 13:00:36', 'aggregator', 'maruti-suzuki-swift-vxi-2026/1783947636875-0.webp');
INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `image_url`, `sort_order`, `created_at`, `source`, `storage_key`) VALUES (9, 2, '/uploads/vehicles/tata-motors-nexon-ev-long-range-2026/1783947638571-0.webp', 0, '2026-07-13 13:00:38', 'aggregator', 'tata-motors-nexon-ev-long-range-2026/1783947638571-0.webp');
INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `image_url`, `sort_order`, `created_at`, `source`, `storage_key`) VALUES (10, 3, '/uploads/vehicles/hero-motocorp-splendor-standard-2026/1783947639939-0.webp', 0, '2026-07-13 13:00:39', 'aggregator', 'hero-motocorp-splendor-standard-2026/1783947639939-0.webp');
INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `image_url`, `sort_order`, `created_at`, `source`, `storage_key`) VALUES (11, 4, '/uploads/vehicles/honda-activa-6g-standard-2026/1783947641349-0.webp', 0, '2026-07-13 13:00:41', 'aggregator', 'honda-activa-6g-standard-2026/1783947641349-0.webp');

DROP TABLE IF EXISTS `vehicle_offers`;
CREATE TABLE `vehicle_offers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint unsigned NOT NULL,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discount_amount` decimal(12,2) DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_till` date NOT NULL,
  `source` enum('aggregator','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aggregator',
  `external_offer_id` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vo_external` (`vehicle_id`,`external_offer_id`),
  KEY `idx_vo_active` (`vehicle_id`,`is_active`,`valid_till`),
  CONSTRAINT `fk_vo_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicle_offers` (`id`, `vehicle_id`, `title`, `description`, `discount_amount`, `valid_from`, `valid_till`, `source`, `external_offer_id`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 'Up to ₹45,000 cash benefit', 'Exchange bonus + corporate discount', '45000.00', NULL, '2026-12-30 18:30:00', 'aggregator', 'OFF-SWIFT-45K', 1, '2026-07-13 12:56:34', '2026-07-13 13:00:36');
INSERT INTO `vehicle_offers` (`id`, `vehicle_id`, `title`, `description`, `discount_amount`, `valid_from`, `valid_till`, `source`, `external_offer_id`, `is_active`, `created_at`, `updated_at`) VALUES (2, 2, 'Zero down payment + 8.99% ROI', NULL, NULL, NULL, '2026-08-14 18:30:00', 'aggregator', 'OFF-NEXON-ZERO-DP', 1, '2026-07-13 12:56:35', '2026-07-13 13:00:38');
INSERT INTO `vehicle_offers` (`id`, `vehicle_id`, `title`, `description`, `discount_amount`, `valid_from`, `valid_till`, `source`, `external_offer_id`, `is_active`, `created_at`, `updated_at`) VALUES (3, 3, '₹3,000 festive discount', NULL, '3000.00', NULL, '2026-12-30 18:30:00', 'aggregator', 'OFF-SPLENDOR-3K', 1, '2026-07-13 12:56:35', '2026-07-13 13:00:39');

DROP TABLE IF EXISTS `vehicle_questions`;
CREATE TABLE `vehicle_questions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `question_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','answered','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_vq_user` (`user_id`),
  KEY `idx_vq_vehicle` (`vehicle_id`,`status`),
  CONSTRAINT `fk_vq_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vq_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vehicle_reviews`;
CREATE TABLE `vehicle_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified_owner` tinyint(1) NOT NULL DEFAULT '0',
  `verification_ref` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `helpful_count` int unsigned NOT NULL DEFAULT '0',
  `status` enum('pending','published','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_vr_user` (`user_id`),
  KEY `idx_vr_vehicle_published` (`vehicle_id`,`status`,`is_verified_owner`),
  CONSTRAINT `fk_vr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_vr_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vehicle_specs`;
CREATE TABLE `vehicle_specs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint unsigned NOT NULL,
  `spec_key` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `spec_value` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vehicle_spec` (`vehicle_id`,`spec_key`),
  CONSTRAINT `fk_spec_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (1, 1, 'ground_clearance_mm', '163');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (2, 1, 'arai_mileage', '22.38');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (3, 1, 'arai_mileage_unit', 'kmpl');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (4, 1, 'seating_capacity', '5');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (5, 1, 'transmission', 'Manual');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (6, 1, 'displacement_cc', '1197');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (7, 2, 'ground_clearance_mm', '190');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (8, 2, 'arai_mileage', '489');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (9, 2, 'arai_mileage_unit', 'km/charge');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (10, 2, 'seating_capacity', '5');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (11, 2, 'transmission', 'Automatic');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (12, 3, 'ground_clearance_mm', '166');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (13, 3, 'arai_mileage', '65');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (14, 3, 'arai_mileage_unit', 'kmpl');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (15, 3, 'seating_capacity', '2');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (16, 3, 'transmission', 'Manual');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (17, 3, 'displacement_cc', '97');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (18, 4, 'ground_clearance_mm', '163');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (19, 4, 'arai_mileage', '60');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (20, 4, 'arai_mileage_unit', 'kmpl');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (21, 4, 'seating_capacity', '2');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (22, 4, 'transmission', 'Automatic');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (23, 4, 'displacement_cc', '109');
INSERT INTO `vehicle_specs` (`id`, `vehicle_id`, `spec_key`, `spec_value`) VALUES (38, 1, 'safety_rating', '4 Star Global NCAP');

DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_type` enum('car','bike') COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` bigint unsigned NOT NULL,
  `model_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variant_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_year` year DEFAULT NULL,
  `external_variant_id` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `fuel_type` enum('petrol','diesel','electric','cng','hybrid') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ex_showroom_price` decimal(12,2) NOT NULL,
  `is_upcoming` tinyint(1) NOT NULL DEFAULT '0',
  `launch_confidence` enum('confirmed','expected','rumoured') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vehicles_external_variant` (`external_variant_id`),
  KEY `fk_vehicle_brand` (`brand_id`),
  KEY `idx_vehicle_type_brand` (`vehicle_type`,`brand_id`),
  CONSTRAINT `fk_vehicle_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicles` (`id`, `vehicle_type`, `brand_id`, `model_name`, `variant_name`, `model_year`, `external_variant_id`, `last_synced_at`, `fuel_type`, `ex_showroom_price`, `is_upcoming`, `launch_confidence`, `created_at`, `updated_at`) VALUES (1, 'car', 1, 'Swift', 'VXi', 2026, 'MARUTI-SWIFT-VXI-2026', '2026-07-13 13:00:33', 'petrol', '649000.00', 0, NULL, '2026-07-13 12:56:20', '2026-07-13 13:00:33');
INSERT INTO `vehicles` (`id`, `vehicle_type`, `brand_id`, `model_name`, `variant_name`, `model_year`, `external_variant_id`, `last_synced_at`, `fuel_type`, `ex_showroom_price`, `is_upcoming`, `launch_confidence`, `created_at`, `updated_at`) VALUES (2, 'car', 2, 'Nexon EV', 'Long Range', 2026, 'TATA-NEXON-EV-LR-2026', '2026-07-13 13:00:36', 'electric', '1499000.00', 0, NULL, '2026-07-13 12:56:20', '2026-07-13 13:00:36');
INSERT INTO `vehicles` (`id`, `vehicle_type`, `brand_id`, `model_name`, `variant_name`, `model_year`, `external_variant_id`, `last_synced_at`, `fuel_type`, `ex_showroom_price`, `is_upcoming`, `launch_confidence`, `created_at`, `updated_at`) VALUES (3, 'bike', 3, 'Splendor+', 'Standard', 2026, 'HERO-SPLENDOR-STD-2026', '2026-07-13 13:00:38', 'petrol', '79500.00', 0, NULL, '2026-07-13 12:56:20', '2026-07-13 13:00:38');
INSERT INTO `vehicles` (`id`, `vehicle_type`, `brand_id`, `model_name`, `variant_name`, `model_year`, `external_variant_id`, `last_synced_at`, `fuel_type`, `ex_showroom_price`, `is_upcoming`, `launch_confidence`, `created_at`, `updated_at`) VALUES (4, 'bike', 4, 'Activa 6G', 'Standard', 2026, 'HONDA-ACTIVA-STD-2026', '2026-07-13 13:00:39', 'petrol', '74000.00', 0, NULL, '2026-07-13 12:56:20', '2026-07-13 13:00:39');

DROP TABLE IF EXISTS `wishlists`;
CREATE TABLE `wishlists` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `vehicle_id` bigint unsigned DEFAULT NULL,
  `listing_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlist_user_vehicle` (`user_id`,`vehicle_id`),
  UNIQUE KEY `uq_wishlist_user_listing` (`user_id`,`listing_id`),
  KEY `fk_wishlist_vehicle` (`vehicle_id`),
  KEY `fk_wishlist_listing` (`listing_id`),
  CONSTRAINT `fk_wishlist_listing` FOREIGN KEY (`listing_id`) REFERENCES `used_vehicle_listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_wishlist_target` CHECK ((((`vehicle_id` is not null) and (`listing_id` is null)) or ((`vehicle_id` is null) and (`listing_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
