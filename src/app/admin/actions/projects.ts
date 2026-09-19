"use server";

import { and, desc, eq, gt, lt, asc, max, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { components, db, features, media, projects } from "@/db";
import { requireSuperAdmin, requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/admin-queries";
import { deleteStoredFiles } from "@/lib/storage";
import { slugify } from "@/lib/slug";

const url = z
  .string()
  .trim()
  .max(1024)
  .refine((u) => u.startsWith("/") || /^https:\/\//.test(u), "Invalid media URL");

const ProjectInput = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(2, "Title is required").max(160),
  designer: z.string().trim().min(2, "Designer is required").max(160),
  category: z.string().trim().min(2, "Category is required").max(80),
  summary: z.string().trim().min(20, "Summary should be at least 20 characters").max(2000),
  overview: z.string().trim().max(5000).optional().default(""),
  principle: z.string().trim().max(5000).optional().default(""),
  partsCount: z.number().int().min(0).max(1_000_000).nullable().optional(),
  status: z.enum(["COMPLETE", "IN_PROGRESS", "CONCEPT"]),
  featured: z.boolean().optional(),
  media: z
    .array(
      z.object({
        type: z.enum(["IMAGE", "VIDEO"]),
        url,
        poster: url.nullable().optional(),
        caption: z.string().trim().max(255).nullable().optional(),
      }),
    )
    .max(20),
  features: z.array(z.string().trim().max(400)).max(12),
  components: z
    .array(z.object({ name: z.string().trim().max(200), description: z.string().trim().max(2000) }))
    .max(40),
});

export type ProjectInput = z.input<typeof ProjectInput>;
export type SaveIntent = "save" | "submit" | "publish";
export type ActionResult = { ok: true; id: number; message: string } | { ok: false; error: string };

async function uniqueSlug(title: string, exceptId?: number) {
  const base = slugify(title);
  for (let i = 0; i < 50; i++) {
    const candidate = i ? `${base}-${i + 1}` : base;
    const cond = exceptId ? and(eq(projects.slug, candidate), ne(projects.id, exceptId)) : eq(projects.slug, candidate);
    const [hit] = await db.select({ id: projects.id }).from(projects).where(cond).limit(1);
    if (!hit) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function saveProject(raw: ProjectInput, intent: SaveIntent): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = ProjectInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  const isSuper = user.role === "SUPER_ADMIN";

  if (intent === "publish" && !isSuper) return { ok: false, error: "Only a super admin can publish." };
  if ((intent === "submit" || intent === "publish") && d.media.length === 0)
    return { ok: false, error: "Add at least one image or video before submitting." };

  const cleanFeatures = d.features.filter(Boolean);
  const cleanComponents = d.components.filter((c) => c.name);

  let existing: typeof projects.$inferSelect | undefined;
  if (d.id) {
    [existing] = await db.select().from(projects).where(eq(projects.id, d.id));
    if (!existing) return { ok: false, error: "Project not found." };
    if (!canEdit(user, existing)) return { ok: false, error: "You can't edit this project in its current state." };
  }

  // Resolve the next workflow state
  let state = existing?.state ?? "DRAFT";
  if (intent === "submit") state = "PENDING";
  if (intent === "publish") state = "PUBLISHED";

  const base = {
    title: d.title,
    designer: d.designer,
    category: d.category,
    summary: d.summary,
    overview: d.overview || null,
    principle: d.principle || null,
    partsCount: d.partsCount ?? null,
    status: d.status,
    state,
    ...(isSuper && d.featured !== undefined ? { featured: d.featured } : {}),
    ...(intent === "submit" ? { reviewNote: null } : {}),
    ...(intent === "publish"
      ? { reviewNote: null, reviewedById: user.id, publishedAt: existing?.publishedAt ?? new Date() }
      : {}),
  };

  let id: number;
  let removed: string[] = [];
  await db.transaction(async (tx) => {
    if (existing) {
      id = existing.id;
      // keep public URLs stable once published
      const slug =
        existing.state !== "PUBLISHED" && existing.title !== d.title ? await uniqueSlug(d.title, id) : existing.slug;
      const oldMedia = await tx.select({ url: media.url, poster: media.poster }).from(media).where(eq(media.projectId, id));
      const keep = new Set(d.media.flatMap((m) => [m.url, m.poster ?? ""]));
      removed = oldMedia.flatMap((m) => [m.url, m.poster ?? ""]).filter((u) => u && !keep.has(u));
      await tx.update(projects).set({ ...base, slug }).where(eq(projects.id, id));
      await tx.delete(media).where(eq(media.projectId, id));
      await tx.delete(features).where(eq(features.projectId, id));
      await tx.delete(components).where(eq(components.projectId, id));
    } else {
      const [{ top }] = await tx.select({ top: max(projects.sortOrder) }).from(projects);
      const [r] = await tx
        .insert(projects)
        .values({ ...base, slug: await uniqueSlug(d.title), createdById: user.id, sortOrder: (top ?? 0) + 1 })
        .$returningId();
      id = r.id;
    }
    if (d.media.length)
      await tx.insert(media).values(
        d.media.map((m, i) => ({ projectId: id, type: m.type, url: m.url, poster: m.poster || null, caption: m.caption || null, order: i })),
      );
    if (cleanFeatures.length)
      await tx.insert(features).values(cleanFeatures.map((text, i) => ({ projectId: id, text, order: i })));
    if (cleanComponents.length)
      await tx
        .insert(components)
        .values(cleanComponents.map((c, i) => ({ projectId: id, name: c.name, description: c.description, order: i })));
  });

  await deleteStoredFiles(removed);
  const message =
    intent === "publish" ? "Published — it's live on the site." : intent === "submit" ? "Submitted for review." : "Saved.";
  return { ok: true, id: id!, message };
}

// ── Review workflow (super admin) ───────────────────────────────────

export async function publishProject(id: number) {
  const me = await requireSuperAdmin();
  const [p] = await db.select({ publishedAt: projects.publishedAt }).from(projects).where(eq(projects.id, id));
  if (!p) return;
  await db
    .update(projects)
    .set({ state: "PUBLISHED", reviewNote: null, reviewedById: me.id, publishedAt: p.publishedAt ?? new Date() })
    .where(eq(projects.id, id));
  refresh();
}

export async function requestChanges(id: number, note: string) {
  const me = await requireSuperAdmin();
  await db
    .update(projects)
    .set({ state: "REJECTED", reviewNote: note.trim().slice(0, 2000) || "Please revise and resubmit.", reviewedById: me.id })
    .where(eq(projects.id, id));
  refresh();
}

export async function unpublishProject(id: number) {
  await requireSuperAdmin();
  await db.update(projects).set({ state: "DRAFT" }).where(eq(projects.id, id));
  refresh();
}

export async function toggleFeatured(id: number) {
  await requireSuperAdmin();
  const [p] = await db.select({ featured: projects.featured }).from(projects).where(eq(projects.id, id));
  if (p) await db.update(projects).set({ featured: !p.featured }).where(eq(projects.id, id));
  refresh();
}

/** Swap display order with the neighbouring published project. */
export async function moveProject(id: number, dir: "up" | "down") {
  await requireSuperAdmin();
  const [p] = await db.select({ sortOrder: projects.sortOrder }).from(projects).where(eq(projects.id, id));
  if (!p) return;
  const [other] = await db
    .select({ id: projects.id, sortOrder: projects.sortOrder })
    .from(projects)
    .where(
      and(
        eq(projects.state, "PUBLISHED"),
        dir === "up" ? lt(projects.sortOrder, p.sortOrder) : gt(projects.sortOrder, p.sortOrder),
      ),
    )
    .orderBy(dir === "up" ? desc(projects.sortOrder) : asc(projects.sortOrder))
    .limit(1);
  if (!other) return;
  await db.transaction(async (tx) => {
    await tx.update(projects).set({ sortOrder: other.sortOrder }).where(eq(projects.id, id));
    await tx.update(projects).set({ sortOrder: p.sortOrder }).where(eq(projects.id, other.id));
  });
  refresh();
}

export async function deleteProject(id: number): Promise<ActionResult> {
  const user = await requireUser();
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p) return { ok: false, error: "Project not found." };
  if (!canEdit(user, p)) return { ok: false, error: "You can't delete this project." };
  const files = await db.select({ url: media.url, poster: media.poster }).from(media).where(eq(media.projectId, id));
  await db.delete(projects).where(eq(projects.id, id)); // children cascade
  await deleteStoredFiles(files.flatMap((f) => [f.url, f.poster ?? ""]));
  return { ok: true, id, message: "Project deleted." };
}
