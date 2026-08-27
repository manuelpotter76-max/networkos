CREATE TABLE `member_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`member_id` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_accounts_org_user` ON `member_accounts` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_accounts_org_member` ON `member_accounts` (`organization_id`,`member_id`);--> statement-breakpoint
CREATE INDEX `idx_member_accounts_email` ON `member_accounts` (`email`);