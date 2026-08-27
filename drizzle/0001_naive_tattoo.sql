CREATE TABLE `organization_admins` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_org_admins_org_user` ON `organization_admins` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_org_admins_user` ON `organization_admins` (`user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`short_name` text NOT NULL,
	`primary_color` text NOT NULL,
	`accent_color` text NOT NULL,
	`font` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_organizations_slug` ON `organizations` (`slug`);--> statement-breakpoint
ALTER TABLE `activity_events` ADD `organization_id` text DEFAULT 'tbc' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_activity_org_created` ON `activity_events` (`organization_id`,`created_at`);