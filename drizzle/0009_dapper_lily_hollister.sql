CREATE TABLE `event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`event_id` text NOT NULL,
	`member_id` text NOT NULL,
	`status` text DEFAULT 'Registered' NOT NULL,
	`checked_in` integer DEFAULT false NOT NULL,
	`registered_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`checked_in_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_event_registrations_org_event_member` ON `event_registrations` (`organization_id`,`event_id`,`member_id`);--> statement-breakpoint
CREATE INDEX `idx_event_registrations_org_event_status` ON `event_registrations` (`organization_id`,`event_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_event_registrations_org_member` ON `event_registrations` (`organization_id`,`member_id`);