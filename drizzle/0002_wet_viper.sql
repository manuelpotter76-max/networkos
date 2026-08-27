CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`month` text NOT NULL,
	`day` text NOT NULL,
	`year` integer NOT NULL,
	`title` text NOT NULL,
	`place` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`time` text NOT NULL,
	`end_time` text NOT NULL,
	`going` integer DEFAULT 0 NOT NULL,
	`capacity` integer DEFAULT 100 NOT NULL,
	`matches` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_org_date` ON `events` (`organization_id`,`year`,`month`,`day`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`industry` text DEFAULT '' NOT NULL,
	`plan` text DEFAULT 'Individual' NOT NULL,
	`status` text DEFAULT 'Invited' NOT NULL,
	`completion` integer DEFAULT 20 NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`looking_for` text DEFAULT '' NOT NULL,
	`can_help` text DEFAULT '' NOT NULL,
	`interests` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_members_org_name` ON `members` (`organization_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_org_email` ON `members` (`organization_id`,`email`);