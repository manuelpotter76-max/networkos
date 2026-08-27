CREATE TABLE `gmail_connections` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`sender_email` text NOT NULL,
	`encrypted_refresh_token` text NOT NULL,
	`encrypted_access_token` text,
	`access_token_expires_at` integer,
	`connected_by_user_id` text NOT NULL,
	`connected_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_gmail_connections_sender` ON `gmail_connections` (`sender_email`);