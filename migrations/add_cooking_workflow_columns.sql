-- Run against your shop database if columns are missing (MySQL).
-- ALTER fails if column exists; run line-by-line or ignore errors.

ALTER TABLE `vendor` ADD COLUMN `cookingDescription` TEXT NULL;
ALTER TABLE `orders` ADD COLUMN `cookingWorkflowStatus` INT NULL;
ALTER TABLE `orders` ADD COLUMN `cookingStartedAt` DATETIME NULL;
ALTER TABLE `orders` ADD COLUMN `cookingCompletedAt` DATETIME NULL;
ALTER TABLE `orders` ADD COLUMN `cookingServiceFee` DOUBLE NULL;
