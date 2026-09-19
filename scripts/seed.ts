/**
 * Seed script — safe to run more than once.
 *  - creates/updates the first SUPER_ADMIN from SEED_ADMIN_* env vars
 *  - imports the 15 legacy projects from the old showcase.html (only when the projects table is empty)
 *
 * Run:  npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { poolOptions } from "../src/db/connection";
import * as s from "../src/db/schema";
import { slugify } from "../src/lib/slug";
import legacy from "./legacy-projects.json";

type Legacy = {
  id: number;
  title: string;
  designer: string;
  parts: number;
  desc: string;
  mediaType: "image" | "video";
  mediaSrc: string;
  images: string[];
  features: string[];
  report?: { overview: string; principle: string; components: { name: string; desc: string }[] };
};

const CATEGORY: Record<number, string> = {
  1: "Industrial Machinery",
  2: "Industrial Machinery",
  3: "Mechanisms & Structures",
  4: "Engines & Propulsion",
  5: "Energy & Sustainability",
  6: "Vehicles & Robotics",
  7: "Surface Design",
  8: "Energy & Sustainability",
  9: "Industrial Machinery",
  10: "Engines & Propulsion",
  11: "Vehicles & Robotics",
  12: "Biomedical",
  13: "Engines & Propulsion",
  14: "Engines & Propulsion",
  15: "Engines & Propulsion",
};
const FEATURED = new Set([13, 12, 11, 3, 1, 15]);
// Content corrections made during migration
const FEATURE_FIXES: Record<string, string> = {
  "Full Brayton-to-Rankine energy chain": "Complete fuel-to-shaft energy conversion chain",
};

async function main() {
  const pool = mysql.createPool(poolOptions());
  const db = drizzle(pool, { schema: s, mode: "default" });

  // 1) Super admin
  let adminId: number | null = null;
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const [existing] = await db.select().from(s.users).where(eq(s.users.email, email));
    if (existing) {
      await db.update(s.users).set({ role: "SUPER_ADMIN", active: true }).where(eq(s.users.id, existing.id));
      adminId = existing.id;
    } else {
      const [r] = await db.insert(s.users).values({
        email,
        name: process.env.SEED_ADMIN_NAME || "SWUG Admin",
        passwordHash: await bcrypt.hash(password, 12),
        role: "SUPER_ADMIN",
      }).$returningId();
      adminId = r.id;
    }
    console.log(`• Super admin ready: ${email}`);
  } else {
    console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin");
  }

  // 2) Legacy projects
  const [{ n }] = await db.select({ n: count() }).from(s.projects);
  if (n > 0) {
    console.log(`• ${n} projects already exist — skipping legacy import`);
  } else {
    for (const [i, p] of (legacy as Legacy[]).entries()) {
      const [r] = await db.insert(s.projects).values({
        slug: slugify(p.title),
        title: p.title,
        designer: p.designer,
        category: CATEGORY[p.id] ?? "General",
        summary: p.desc,
        overview: p.report?.overview ?? null,
        principle: p.report?.principle ?? null,
        partsCount: p.parts > 0 ? p.parts : null,
        status: "COMPLETE",
        featured: FEATURED.has(p.id),
        sortOrder: i,
        state: "PUBLISHED",
        publishedAt: new Date(),
        createdById: adminId,
        reviewedById: adminId,
      }).$returningId();

      const m: (typeof s.media.$inferInsert)[] = [];
      if (p.mediaType === "video") m.push({
          projectId: r.id,
          type: "VIDEO",
          url: "/" + p.mediaSrc,
          poster: p.mediaSrc.replace("assets/videos/", "/assets/posters/").replace(/\.mp4$/, ".jpg"),
          order: 0,
        });
      const imgs = p.images.length ? p.images : p.mediaType === "image" ? [p.mediaSrc] : [];
      for (const src of imgs) m.push({ projectId: r.id, type: "IMAGE", url: "/" + src, order: m.length });
      if (m.length) await db.insert(s.media).values(m);

      if (p.features.length)
        await db.insert(s.features).values(
          p.features.map((t, k) => ({ projectId: r.id, text: FEATURE_FIXES[t] ?? t, order: k })),
        );
      const comps = p.report?.components ?? [];
      if (comps.length)
        await db.insert(s.components).values(
          comps.map((c, k) => ({ projectId: r.id, name: c.name, description: c.desc, order: k })),
        );
    }
    console.log(`• Imported ${legacy.length} legacy projects`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
