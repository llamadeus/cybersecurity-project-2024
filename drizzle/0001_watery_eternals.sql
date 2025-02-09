CREATE TABLE `slot_chunks` (
	`slot_id` text NOT NULL,
	`chunk_id` text NOT NULL,
	PRIMARY KEY(`slot_id`, `chunk_id`),
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chunk_id`) REFERENCES `chunks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`vault_id` text NOT NULL,
	`max_size` integer NOT NULL,
	`attributes` text NOT NULL,
	`file_x25519_public_key` text,
	`file_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`vault_id`) REFERENCES `vaults`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vaults` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`key` text NOT NULL,
	`attributes` text NOT NULL,
	`auth_ed25519_private_key` text NOT NULL,
	`auth_ed25519_public_key` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` ADD `x25519_private_key` text;--> statement-breakpoint
ALTER TABLE `users` ADD `x25519_public_key` text;