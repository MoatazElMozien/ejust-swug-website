/**
 * E-JUST SWUG — database schema (MySQL 8 / TiDB compatible)
 * Apply with:  npm run db:push
 */
import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const ROLES = ["SUPER_ADMIN", "EDITOR"] as const;
/** DRAFT → PENDING (submitted) → PUBLISHED | REJECTED */
export const PUBLISH_STATES = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED"] as const;
export const PROJECT_STATUSES = ["COMPLETE", "IN_PROGRESS", "CONCEPT"] as const;
export const MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;

export type Role = (typeof ROLES)[number];
export type PublishState = (typeof PUBLISH_STATES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type MediaType = (typeof MEDIA_TYPES)[number];

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 191 }).notNull(),
  role: mysqlEnum("role", ROLES).notNull().default("EDITOR"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 191 }).notNull().unique(),
    title: varchar("title", { length: 160 }).notNull(),
    designer: varchar("designer", { length: 160 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    summary: text("summary").notNull(),
    overview: text("overview"),
    principle: text("principle"),
    partsCount: int("parts_count"),
    status: mysqlEnum("status", PROJECT_STATUSES).notNull().default("COMPLETE"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),

    state: mysqlEnum("state", PUBLISH_STATES).notNull().default("DRAFT"),
    reviewNote: text("review_note"),
    publishedAt: timestamp("published_at"),

    createdById: int("created_by_id").references(() => users.id, { onDelete: "set null" }),
    reviewedById: int("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("projects_state_sort_idx").on(t.state, t.sortOrder)],
);

export const media = mysqlTable(
  "media",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", MEDIA_TYPES).notNull(),
    url: varchar("url", { length: 1024 }).notNull(),
    /** Still frame shown before a video loads (optional). */
    poster: varchar("poster", { length: 1024 }),
    caption: varchar("caption", { length: 255 }),
    order: int("order").notNull().default(0),
  },
  (t) => [index("media_project_idx").on(t.projectId)],
);

export const features = mysqlTable(
  "features",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    text: varchar("text", { length: 400 }).notNull(),
    order: int("order").notNull().default(0),
  },
  (t) => [index("features_project_idx").on(t.projectId)],
);

/** "Parts breakdown" — main components / sub-assemblies of a project. */
export const components = mysqlTable(
  "components",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description").notNull(),
    order: int("order").notNull().default(0),
  },
  (t) => [index("components_project_idx").on(t.projectId)],
);

export const socialLinks = mysqlTable("social_links", {
  id: int("id").autoincrement().primaryKey(),
  platform: varchar("platform", { length: 40 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  order: int("order").notNull().default(0),
});

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  position: varchar("position", { length: 120 }).notNull(),
  photoUrl: varchar("photo_url", { length: 1024 }),
  linkedinUrl: varchar("linkedin_url", { length: 500 }),
  order: int("order").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type Component = typeof components.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
