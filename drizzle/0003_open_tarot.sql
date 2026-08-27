CREATE TABLE `member_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`member_id` text,
	`event_id` text,
	`note` text DEFAULT '' NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_member_actions_org_user` ON `member_actions` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_member_actions_kind_event` ON `member_actions` (`organization_id`,`kind`,`event_id`);--> statement-breakpoint
CREATE TABLE `networking_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`ideal_clients` text DEFAULT '' NOT NULL,
	`referral_partners` text DEFAULT '' NOT NULL,
	`current_goal` text DEFAULT '' NOT NULL,
	`expertise` text DEFAULT '' NOT NULL,
	`introductions` text DEFAULT '' NOT NULL,
	`geography` text DEFAULT '' NOT NULL,
	`industries` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'members' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_networking_goals_org_user` ON `networking_goals` (`organization_id`,`user_id`);