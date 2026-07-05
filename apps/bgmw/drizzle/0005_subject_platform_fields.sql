ALTER TABLE `subjects` RENAME COLUMN "data" TO "bangumi";--> statement-breakpoint
ALTER TABLE `subjects` ADD `tmdb` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `poster` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `subjects` ADD `onair_date` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `alias` text DEFAULT '{}' NOT NULL;
