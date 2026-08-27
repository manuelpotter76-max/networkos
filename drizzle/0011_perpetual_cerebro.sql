CREATE TABLE `organization_message_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`message_id` text NOT NULL,
	`member_id` text NOT NULL,
	`recipient_email` text NOT NULL,
	`status` text NOT NULL,
	`gmail_message_id` text,
	`error` text,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_message_deliveries_message_member` ON `organization_message_deliveries` (`message_id`,`member_id`);--> statement-breakpoint
CREATE INDEX `idx_message_deliveries_org_status` ON `organization_message_deliveries` (`organization_id`,`status`);--> statement-breakpoint
ALTER TABLE `members` ADD `email_opt_out` integer DEFAULT false NOT NULL;