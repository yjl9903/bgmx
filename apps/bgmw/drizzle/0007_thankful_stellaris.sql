ALTER TABLE `calendars` ADD `updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `calendars` SET `updated_at` = unixepoch() * 1000 WHERE `updated_at` = 0;
