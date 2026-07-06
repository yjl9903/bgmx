CREATE TABLE `subject_search_titles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`title` text NOT NULL,
	`normalized_title` text NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subject_search_titles_subject_normalized_title_idx` ON `subject_search_titles` (`subject_id`,`normalized_title`);--> statement-breakpoint
CREATE INDEX `subject_search_titles_subject_id_idx` ON `subject_search_titles` (`subject_id`);