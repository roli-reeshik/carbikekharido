-- Vehicles marketplace module (Prisma migration: add_vehicles_module)
-- Safe to apply alongside legacy catalog tables in db/schema.sql

-- CreateTable
CREATE TABLE `app_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `phone_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `app_users_email_key`(`email`),
    INDEX `app_users_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `posts_author_id_idx`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `post_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comments_post_id_idx`(`post_id`),
    INDEX `comments_author_id_idx`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sellers` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `seller_type` ENUM('INDIVIDUAL', 'DEALER') NOT NULL,
    `dealer_name` VARCHAR(191) NULL,
    `dealer_reg_number` VARCHAR(191) NULL,
    `dealer_website` VARCHAR(191) NULL,
    `ratings` DOUBLE NOT NULL DEFAULT 0,
    `total_reviews` INTEGER NOT NULL DEFAULT 0,
    `verification_status` INTEGER NOT NULL DEFAULT 0,
    `member_since` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `avg_response_time` INTEGER NULL,

    UNIQUE INDEX `sellers_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `seller_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `vehicle_type` ENUM('CAR', 'BIKE') NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year_of_manufacture` INTEGER NOT NULL,
    `color` VARCHAR(191) NULL,
    `condition` VARCHAR(191) NOT NULL,
    `registration_number` VARCHAR(191) NULL,
    `fuel_type` VARCHAR(191) NULL,
    `transmission` VARCHAR(191) NULL,
    `engine_cc` INTEGER NULL,
    `power` VARCHAR(191) NULL,
    `torque` VARCHAR(191) NULL,
    `current_mileage` INTEGER NULL,
    `owner_type` VARCHAR(191) NULL,
    `insurance_valid` BOOLEAN NOT NULL DEFAULT false,
    `insurance_valid_till` DATETIME(3) NULL,
    `pollution_cert_valid` BOOLEAN NOT NULL DEFAULT false,
    `pollution_cert_valid_till` DATETIME(3) NULL,
    `service_history_avail` BOOLEAN NOT NULL DEFAULT false,
    `accident_history` BOOLEAN NOT NULL DEFAULT false,
    `accident_description` TEXT NULL,
    `modifications` TEXT NULL,
    `asking_price` BIGINT NOT NULL,
    `price_negotiable` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `listing_type` ENUM('NORMAL', 'URGENT', 'BEST_DEAL') NOT NULL DEFAULT 'NORMAL',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SOLD', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `inquiry_count` INTEGER NOT NULL DEFAULT 0,
    `saved_count` INTEGER NOT NULL DEFAULT 0,
    `features` VARCHAR(191) NOT NULL DEFAULT '[]',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `published_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `sold_at` DATETIME(3) NULL,

    INDEX `marketplace_vehicles_seller_id_idx`(`seller_id`),
    INDEX `marketplace_vehicles_city_idx`(`city`),
    INDEX `marketplace_vehicles_status_idx`(`status`),
    INDEX `marketplace_vehicles_created_at_idx`(`created_at`),
    UNIQUE INDEX `marketplace_vehicles_registration_number_city_key`(`registration_number`, `city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_vehicle_images` (
    `id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `type` ENUM('PHOTO', 'VIDEO') NOT NULL DEFAULT 'PHOTO',
    `order` INTEGER NOT NULL DEFAULT 0,
    `is_thumb` BOOLEAN NOT NULL DEFAULT false,
    `quality` VARCHAR(191) NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `marketplace_vehicle_images_vehicle_id_order_idx`(`vehicle_id`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_wishlists` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `saved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `marketplace_wishlists_user_id_idx`(`user_id`),
    UNIQUE INDEX `marketplace_wishlists_user_id_vehicle_id_key`(`user_id`, `vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_inquiries` (
    `id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `buyer_id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('PENDING', 'CONTACTED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responded_at` DATETIME(3) NULL,

    INDEX `marketplace_inquiries_vehicle_id_idx`(`vehicle_id`),
    INDEX `marketplace_inquiries_buyer_id_idx`(`buyer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `seller_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `marketplace_reviews_seller_id_idx`(`seller_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_price_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `max_price` BIGINT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `marketplace_price_alerts_user_id_idx`(`user_id`),
    INDEX `marketplace_price_alerts_vehicle_id_idx`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sellers` ADD CONSTRAINT `sellers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_vehicles` ADD CONSTRAINT `marketplace_vehicles_seller_id_fkey` FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_vehicles` ADD CONSTRAINT `marketplace_vehicles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_vehicle_images` ADD CONSTRAINT `marketplace_vehicle_images_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `marketplace_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_wishlists` ADD CONSTRAINT `marketplace_wishlists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_wishlists` ADD CONSTRAINT `marketplace_wishlists_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `marketplace_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_inquiries` ADD CONSTRAINT `marketplace_inquiries_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `marketplace_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_inquiries` ADD CONSTRAINT `marketplace_inquiries_buyer_id_fkey` FOREIGN KEY (`buyer_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_reviews` ADD CONSTRAINT `marketplace_reviews_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `marketplace_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_reviews` ADD CONSTRAINT `marketplace_reviews_seller_id_fkey` FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_reviews` ADD CONSTRAINT `marketplace_reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_price_alerts` ADD CONSTRAINT `marketplace_price_alerts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_price_alerts` ADD CONSTRAINT `marketplace_price_alerts_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `marketplace_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
