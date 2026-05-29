CREATE TABLE `rsvp` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `event` ADD `location` text;--> statement-breakpoint
ALTER TABLE `event` ADD `time` text;--> statement-breakpoint
ALTER TABLE `event` ADD `rsvpsEnabled` integer DEFAULT false NOT NULL;