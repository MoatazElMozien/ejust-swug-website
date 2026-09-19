import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users, type User } from "@/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session-token";

export type SessionUser = Pick<User, "id" | "name" | "email" | "role">;

/** Current signed-in, active admin — or null. Always re-checked against the DB. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [u] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active })
    .from(users)
    .where(eq(users.id, session.uid));
  if (!u || !u.active) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
});

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/admin/login");
  return u;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "SUPER_ADMIN") redirect("/admin?denied=1");
  return u;
}

export async function startSession(u: Pick<User, "id" | "role">) {
  const token = await signSession({ uid: u.id, role: u.role });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
