CREATE TABLE `organization_settings` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`individual_price` integer DEFAULT 79 NOT NULL,
	`professional_price` integer DEFAULT 149 NOT NULL,
	`founding_price` integer DEFAULT 249 NOT NULL,
	`require_approved_membership` integer DEFAULT true NOT NULL,
	`show_event_attendees` integer DEFAULT true NOT NULL,
	`event_reminder` integer DEFAULT true NOT NULL,
	`follow_up_prompt` integer DEFAULT true NOT NULL,
	`renewal_notice` integer DEFAULT true NOT NULL,
	`profile_reminder` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
