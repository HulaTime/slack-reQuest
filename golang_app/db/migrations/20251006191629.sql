-- Disable the enforcement of foreign-keys constraints
PRAGMA foreign_keys = off;
-- Create "new_requests" table
CREATE TABLE `new_requests` (
  `id` varchar NOT NULL,
  `title` varchar NOT NULL,
  `description` varchar NULL,
  `accepted_by_id` text NULL,
  `created_by_id` text NOT NULL,
  `recipient_id` text NOT NULL,
  `recipient_type` text NOT NULL,
  `status` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
);
-- Copy rows from old table "requests" to new temporary table "new_requests"
INSERT INTO `new_requests` (`id`, `title`, `description`, `accepted_by_id`, `created_by_id`, `recipient_id`, `recipient_type`, `status`, `created_at`, `updated_at`) SELECT `id`, `title`, `description`, `accepted_by_id`, `created_by_id`, `recipient_id`, `recipient_type`, `status`, `created_at`, `updated_at` FROM `requests`;
-- Drop "requests" table after copying rows
DROP TABLE `requests`;
-- Rename temporary table "new_requests" to "requests"
ALTER TABLE `new_requests` RENAME TO `requests`;
-- Create index "idx_requests_status" to table: "requests"
CREATE INDEX `idx_requests_status` ON `requests` (`status`);
-- Create index "idx_requests_recipient_id" to table: "requests"
CREATE INDEX `idx_requests_recipient_id` ON `requests` (`recipient_id`);
-- Create index "idx_requests_created_by_id" to table: "requests"
CREATE INDEX `idx_requests_created_by_id` ON `requests` (`created_by_id`);
-- Create index "idx_requests_accepted_by_id" to table: "requests"
CREATE INDEX `idx_requests_accepted_by_id` ON `requests` (`accepted_by_id`);
-- Enable back the enforcement of foreign-keys constraints
PRAGMA foreign_keys = on;
