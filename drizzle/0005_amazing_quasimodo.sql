CREATE TABLE `member_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`member_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'Member' NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`invited_by_user_id` text NOT NULL,
	`claimed_by_user_id` text,
	`created_at` integer NOT NULL,
	`claimed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_invitations_org_email` ON `member_invitations` (`organization_id`,`email`);--> statement-breakpoint
CREATE INDEX `idx_member_invitations_email_status` ON `member_invitations` (`email`,`status`);