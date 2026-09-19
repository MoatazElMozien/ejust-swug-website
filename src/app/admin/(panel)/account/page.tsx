import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold">My account</h1>
      <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-panel text-sm">
        {[
          ["Name", me.name],
          ["Email", me.email],
          ["Role", me.role === "SUPER_ADMIN" ? "Super admin" : "Editor"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-8 rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
