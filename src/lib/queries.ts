import "server-only";
import { and, asc, count, countDistinct, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import {
  db,
  components,
  features,
  media,
  projects,
  socialLinks,
  teamMembers,
  type Component,
  type Feature,
  type Media,
  type Project,
} from "@/db";

// NOTE: plain selects + IN() lookups (no relational/LATERAL queries) so the
// same code runs on MySQL 8, MariaDB and TiDB Cloud.

const published = eq(projects.state, "PUBLISHED");

export type ProjectFull = Project & { media: Media[]; features: Feature[]; components: Component[] };
export type ProjectCardData = Pick<
  Project,
  "id" | "slug" | "title" | "designer" | "category" | "summary" | "partsCount" | "status"
> & { media: Media[] };

export async function mediaFor(ids: number[]): Promise<Map<number, Media[]>> {
  const map = new Map<number, Media[]>();
  if (!ids.length) return map;
  const rows = await db.select().from(media).where(inArray(media.projectId, ids)).orderBy(asc(media.order), asc(media.id));
  for (const r of rows) {
    const list = map.get(r.projectId) ?? [];
    list.push(r);
    map.set(r.projectId, list);
  }
  return map;
}

/** Loads a project with media, features and parts breakdown. */
export async function loadFullProject(where: SQL): Promise<ProjectFull | null> {
  const [p] = await db.select().from(projects).where(where).limit(1);
  if (!p) return null;
  const [m, f, c] = await Promise.all([
    db.select().from(media).where(eq(media.projectId, p.id)).orderBy(asc(media.order), asc(media.id)),
    db.select().from(features).where(eq(features.projectId, p.id)).orderBy(asc(features.order), asc(features.id)),
    db.select().from(components).where(eq(components.projectId, p.id)).orderBy(asc(components.order), asc(components.id)),
  ]);
  return { ...p, media: m, features: f, components: c };
}

export async function getPublishedProjects(
  opts: { q?: string; category?: string; featured?: boolean } = {},
): Promise<ProjectCardData[]> {
  const conds: SQL[] = [published];
  if (opts.category) conds.push(eq(projects.category, opts.category));
  if (opts.featured) conds.push(eq(projects.featured, true));
  if (opts.q) {
    const term = `%${opts.q.replace(/[%_\\]/g, "")}%`;
    conds.push(or(like(projects.title, term), like(projects.designer, term), like(projects.summary, term))!);
  }
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      designer: projects.designer,
      category: projects.category,
      summary: projects.summary,
      partsCount: projects.partsCount,
      status: projects.status,
    })
    .from(projects)
    .where(and(...conds))
    .orderBy(asc(projects.sortOrder), desc(projects.publishedAt));
  const m = await mediaFor(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, media: m.get(r.id) ?? [] }));
}

export function getPublishedProject(slug: string) {
  return loadFullProject(and(published, eq(projects.slug, slug))!);
}

/** Previous / next published projects for detail-page navigation. */
export async function getNeighbours(id: number) {
  const all = await db
    .select({ id: projects.id, slug: projects.slug, title: projects.title })
    .from(projects)
    .where(published)
    .orderBy(asc(projects.sortOrder), desc(projects.publishedAt));
  const i = all.findIndex((p) => p.id === id);
  if (i < 0 || all.length < 2) return { prev: null, next: null };
  return { prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
}

export async function getPublishedCategories() {
  const rows = await db
    .select({ category: projects.category, n: count() })
    .from(projects)
    .where(published)
    .groupBy(projects.category)
    .orderBy(desc(count()), asc(projects.category));
  return rows.map((r) => ({ category: r.category, n: Number(r.n) }));
}

export async function getSiteStats() {
  const [row] = await db
    .select({
      projects: count(),
      parts: sql<number>`coalesce(sum(${projects.partsCount}), 0)`,
      designers: countDistinct(projects.designer),
    })
    .from(projects)
    .where(published);
  return { projects: Number(row.projects), parts: Number(row.parts), designers: Number(row.designers) };
}

export function getSocialLinks() {
  return db.select().from(socialLinks).orderBy(asc(socialLinks.order), asc(socialLinks.id));
}

export function getTeam() {
  return db.select().from(teamMembers).orderBy(asc(teamMembers.order), asc(teamMembers.id));
}
