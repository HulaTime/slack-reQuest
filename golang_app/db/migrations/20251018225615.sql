-- Disable the enforcement of foreign-keys constraints
PRAGMA foreign_keys = off;
-- Drop "groups" table
DROP TABLE `groups`;
-- Add column "channel_id" to table: "queues"
ALTER TABLE `queues` ADD COLUMN `channel_id` varchar NULL;
-- Add column "admin_ids" to table: "queues"
ALTER TABLE `queues` ADD COLUMN `admin_ids` json NULL;
-- Add column "member_ids" to table: "queues"
ALTER TABLE `queues` ADD COLUMN `member_ids` json NULL;
-- Create index "idx_queues_channel_id" to table: "queues"
CREATE INDEX `idx_queues_channel_id` ON `queues` (`channel_id`);
-- Add column "rejection_reason" to table: "requests"
ALTER TABLE `requests` ADD COLUMN `rejection_reason` varchar NULL;
-- Enable back the enforcement of foreign-keys constraints
PRAGMA foreign_keys = on;
