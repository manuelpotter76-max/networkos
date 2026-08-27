CREATE TABLE `organization_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`audience` text NOT NULL,
	`channel` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`queued_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_org_messages_org_updated` ON `organization_messages` (`organization_id`,`updated_at`);