CREATE TABLE `components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `components_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`text` varchar(400) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `features_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`type` enum('IMAGE','VIDEO') NOT NULL,
	`url` varchar(1024) NOT NULL,
	`poster` varchar(1024),
	`caption` varchar(255),
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(191) NOT NULL,
	`title` varchar(160) NOT NULL,
	`designer` varchar(160) NOT NULL,
	`category` varchar(80) NOT NULL,
	`summary` text NOT NULL,
	`overview` text,
	`principle` text,
	`parts_count` int,
	`status` enum('COMPLETE','IN_PROGRESS','CONCEPT') NOT NULL DEFAULT 'COMPLETE',
	`featured` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`state` enum('DRAFT','PENDING','PUBLISHED','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`review_note` text,
	`published_at` timestamp,
	`created_by_id` int,
	`reviewed_by_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `social_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` varchar(40) NOT NULL,
	`url` varchar(500) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `social_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`position` varchar(120) NOT NULL,
	`photo_url` varchar(1024),
	`linkedin_url` varchar(500),
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(191) NOT NULL,
	`role` enum('SUPER_ADMIN','EDITOR') NOT NULL DEFAULT 'EDITOR',
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `components` ADD CONSTRAINT `components_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `features` ADD CONSTRAINT `features_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_reviewed_by_id_users_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `components_project_idx` ON `components` (`project_id`);--> statement-breakpoint
CREATE INDEX `features_project_idx` ON `features` (`project_id`);--> statement-breakpoint
CREATE INDEX `media_project_idx` ON `media` (`project_id`);--> statement-breakpoint
CREATE INDEX `projects_state_sort_idx` ON `projects` (`state`,`sort_order`);