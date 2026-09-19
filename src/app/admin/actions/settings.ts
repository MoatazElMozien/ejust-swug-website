"use server";

import bcrypt from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db, socialLinks, teamMembers, users } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import { deleteStoredFiles } from "@/lib/storage";
import type { FormState } from "./auth";

// ── Admin accounts ─────────────────────────────────────────────────

const NewUser = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.email("Enter a valid email").max(191),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]),
});

export async function createUser(_: FormState, form: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const r = NewUser.safeParse(Object.fromEntries(form));
  if (!r.success) return { error: r.error.issues[0].message };
  const email = r.data.email.toLowerCase();
  const [dupe] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (dupe) return { error: "An account with that email already exists." };
  await db.insert(users).values({
    name: r.data.name,
    email,
    role: r.data.role,
    passwordHash: await bcrypt.hash(r.data.password, 12),
  });
  refresh();
  return { ok: `Account created for ${email}. Share the password with them privately.` };
}

async function superAdminsLeft(excludingId: number) {
  const [r] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "SUPER_ADMIN"), eq(users.active, true), ne(users.id, excludingId)));
  return Number(r.n);
}

export async function updateUser(id: number, patch: { role?: "SUPER_ADMIN" | "EDITOR"; active?: boolean }) {
  const me = await requireSuperAdmin();
  if (id === me.id) return { error: "You can't change your own role or status." };
  const demoting = patch.role === "EDITOR" || patch.active === false;
  if (demoting && (await superAdminsLeft(id)) === 0) return { error: "There must be at least one active super admin." };
  await db.update(users).set(patch).where(eq(users.id, id));
  refresh();
  return {};
}

export async function resetPassword(id: number, password: string) {
  await requireSuperAdmin();
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 12) }).where(eq(users.id, id));
  return { ok: "Password reset." };
}

export async function deleteUser(id: number) {
  const me = await requireSuperAdmin();
  if (id === me.id) return { error: "You can't delete your own account." };
  if ((await superAdminsLeft(id)) === 0) return { error: "There must be at least one active super admin." };
  await db.delete(users).where(eq(users.id, id)); // their projects stay (author set to null)
  refresh();
  return {};
}

// ── Social links ───────────────────────────────────────────────────

const Social = z.object({
  platform: z.string().trim().min(1).max(40),
  url: z.string().trim().min(3, "Enter a link").max(500),
});

export async function saveSocials(list: { platform: string; url: string }[]) {
  await requireSuperAdmin();
  const parsed = z.array(Social).max(20).safeParse(list.filter((s) => s.url.trim()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  for (const s of parsed.data) {
    const isEmail = s.platform.toLowerCase() === "email";
    if (!isEmail && !/^https?:\/\//.test(s.url)) return { error: `${s.platform}: link must start with https://` };
  }
  await db.transaction(async (tx) => {
    await tx.delete(socialLinks);
    if (parsed.data.length)
      await tx.insert(socialLinks).values(parsed.data.map((s, i) => ({ ...s, order: i })));
  });
  refresh();
  return { ok: "Social links saved." };
}

// ── Team members ───────────────────────────────────────────────────

const Member = z.object({
  name: z.string().trim().min(2, "Each member needs a name").max(120),
  position: z.string().trim().min(1, "Each member needs a position").max(120),
  photoUrl: z.string().trim().max(1024).nullable().optional(),
  linkedinUrl: z
    .string()
    .trim()
    .max(500)
    .refine((u) => !u || /^https:\/\//.test(u), "LinkedIn links must start with https://")
    .nullable()
    .optional(),
});

export async function saveTeam(list: z.input<typeof Member>[]) {
  await requireSuperAdmin();
  const parsed = z.array(Member).max(60).safeParse(list);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const old = await db.select({ photoUrl: teamMembers.photoUrl }).from(teamMembers);
  const keep = new Set(parsed.data.map((m) => m.photoUrl).filter(Boolean));
  await db.transaction(async (tx) => {
    await tx.delete(teamMembers);
    if (parsed.data.length)
      await tx.insert(teamMembers).values(
        parsed.data.map((m, i) => ({
          name: m.name,
          position: m.position,
          photoUrl: m.photoUrl || null,
          linkedinUrl: m.linkedinUrl || null,
          order: i,
        })),
      );
  });
  await deleteStoredFiles(old.map((o) => o.photoUrl ?? "").filter((u) => u && !keep.has(u)));
  refresh();
  return { ok: "Team saved." };
}
