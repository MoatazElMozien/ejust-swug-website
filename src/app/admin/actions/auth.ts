"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { endSession, requireUser, startSession } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

// Basic brute-force brake (per server instance).
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const nextRaw = String(form.get("next") ?? "");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}:${email}`;
  const a = attempts.get(key);
  if (a && a.n >= 5 && a.until > Date.now()) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  if (!email || !password) return { error: "Enter your email and password." };

  const [u] = await db.select().from(users).where(eq(users.email, email));
  const ok = u && u.active && (await bcrypt.compare(password, u.passwordHash));
  if (!ok) {
    const n = (a && a.until > Date.now() ? a.n : 0) + 1;
    attempts.set(key, { n, until: Date.now() + 10 * 60_000 });
    await new Promise((r) => setTimeout(r, 400));
    return { error: u && !u.active ? "This account has been deactivated." : "Incorrect email or password." };
  }
  attempts.delete(key);
  await startSession(u);
  redirect(next);
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function changeOwnPassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "The new passwords don't match." };
  const [u] = await db.select().from(users).where(eq(users.id, me.id));
  if (!u || !(await bcrypt.compare(current, u.passwordHash))) return { error: "Current password is incorrect." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(users.id, me.id));
  return { ok: "Password updated." };
}
