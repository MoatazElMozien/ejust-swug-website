import "server-only";
import { and, asc, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db, projects, users, type PublishState } from "@/db";
import type { SessionUser } from "./auth";
import { loadFullProject, mediaFor } from "./queries";

export async function countPending() {
  const [r] = await db.select({ n: count() }).from(projects).where(eq(projects.state, "PENDING"));
  return Number(r.n);
}

export async function stateCounts(user: SessionUser) {
  const scope = user.role === "SUPER_ADMIN" ? undefined : eq(projects.createdById, user.id);
  const rows = await db.select({ state: projects.state, n: count() }).from(projects).where(scope).groupBy(projects.state);
  const out: Record<PublishState, number> = { DRAFT: 0, PENDING: 0, PUBLISHED: 0, REJECTED: 0 };
  for (const r of rows) out[r.state] = Number(r.n);
  return out;
}

export async function listProjects(user: SessionUser, state?: PublishState, mine = false) {
  const conds: SQL[] = [];
  if (state) conds.push(eq(projects.state, state));
  if (user.role !== "SUPER_ADMIN" || mine) conds.push(eq(projects.createdById, user.id));
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      designer: projects.designer,
      category: projects.category,
      state: projects.state,
      featured: projects.featured,
      sortOrder: projects.sortOrder,
      updatedAt: projects.updatedAt,
      reviewNote: projects.reviewNote,
      createdById: projects.createdById,
      author: users.name,
    })
    .from(projects)
    .leftJoin(users, eq(users.id, projects.createdById))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(
      state === "PUBLISHED" || !state ? asc(projects.sortOrder) : desc(projects.updatedAt),
      desc(projects.updatedAt),
    );
  const m = await mediaFor(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, cover: m.get(r.id)?.[0] ?? null }));
}

export async function getProjectForEdit(id: number) {
  const p = await loadFullProject(eq(projects.id, id));
  if (!p) return null;
  const ids = [p.createdById, p.reviewedById].filter((x): x is number => !!x);
  const people = ids.length
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ids))
    : [];
  const name = (uid: number | null) => people.find((u) => u.id === uid)?.name ?? null;
  return { ...p, authorName: name(p.createdById), reviewerName: name(p.reviewedById) };
}

export type EditableProject = NonNullable<Awaited<ReturnType<typeof getProjectForEdit>>>;

/** Editors may only edit their own drafts / returned projects. */
export function canEdit(user: SessionUser, p: { createdById: number | null; state: PublishState }) {
  if (user.role === "SUPER_ADMIN") return true;
  return p.createdById === user.id && (p.state === "DRAFT" || p.state === "REJECTED");
}
