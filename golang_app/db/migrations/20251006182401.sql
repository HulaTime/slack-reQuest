-- Create "requests" table
CREATE TABLE `requests` (
  `id` varchar NULL,
  `title` varchar NOT NULL,
  `description` varchar NOT NULL,
  `accepted_by_id` text NULL,
  `created_by_id` text NOT NULL,
  `recipient_id` text NULL,
  `recipient_type` text NOT NULL,
  `status` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
);
-- Create index "idx_requests_status" to table: "requests"
CREATE INDEX `idx_requests_status` ON `requests` (`status`);
-- Create index "idx_requests_recipient_id" to table: "requests"
CREATE INDEX `idx_requests_recipient_id` ON `requests` (`recipient_id`);
-- Create index "idx_requests_created_by_id" to table: "requests"
CREATE INDEX `idx_requests_created_by_id` ON `requests` (`created_by_id`);
-- Create index "idx_requests_accepted_by_id" to table: "requests"
CREATE INDEX `idx_requests_accepted_by_id` ON `requests` (`accepted_by_id`);
