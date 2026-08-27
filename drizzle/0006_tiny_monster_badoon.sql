CREATE TABLE `organization_admin_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'Admin' NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`invited_by_user_id` text NOT NULL,
	`claimed_by_user_id` text,
	`created_at` integer NOT NULL,
	`claimed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_org_admin_invites_org_email` ON `organization_admin_invitations` (`organization_id`,`email`);--> statement-breakpoint
CREATE INDEX `idx_org_admin_invites_email_status` ON `organization_admin_invitations` (`email`,`status`);