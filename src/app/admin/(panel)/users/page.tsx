import { asc } from "drizzle-orm";
import { db, users } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import { CreateUserForm, UserRow } from "./UserControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin accounts" };

export default async function UsersPage() {
  const me = await requireSuperAdmin();
  const list = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.role), asc(users.name));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Admin accounts</h1>
        <p className="mt-1 text-sm text-muted">
          <b className="text-fg">Editors</b> can create projects and submit them for review.{" "}
          <b className="text-fg">Super admins</b> publish projects and manage the team, social links and accounts.
        </p>
      </div>

      <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
        {list.map((u) => (
          <UserRow key={u.id} user={u} isMe={u.id === me.id} />
        ))}
      </ul>

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Add an account</h2>
        <p className="mt-0.5 text-sm text-muted">Set a temporary password and share it privately — they can change it under “My account”.</p>
        <CreateUserForm />
      </section>
    </div>
  );
}
