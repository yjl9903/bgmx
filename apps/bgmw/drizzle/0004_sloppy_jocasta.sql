PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE `calendars`;--> statement-breakpoint
CREATE TABLE `calendars` (
	`season` text PRIMARY KEY NOT NULL,
	`is_active` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_relations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season` text NOT NULL,
	`subject_id` integer NOT NULL,
	`platform` text NOT NULL,
	`weekday` integer,
	FOREIGN KEY (`season`) REFERENCES `calendars`(`season`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
