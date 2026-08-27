CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`member_id` text,
	`event_id` text,
	`created_at` integer NOT NULL
);
