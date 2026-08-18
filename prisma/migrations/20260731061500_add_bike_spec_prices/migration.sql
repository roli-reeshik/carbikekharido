-- The catalog index has no price for any of the 992 two-wheeler models, so
-- these columns become the only source of bike pricing in the system.
ALTER TABLE `bike_specs`
    ADD COLUMN `ex_showroom_min_inr` INTEGER NULL,
    ADD COLUMN `ex_showroom_max_inr` INTEGER NULL,
    ADD COLUMN `on_road_min_inr` INTEGER NULL,
    ADD COLUMN `on_road_max_inr` INTEGER NULL;

CREATE INDEX `bike_specs_ex_showroom_min_inr_idx` ON `bike_specs`(`ex_showroom_min_inr`);
