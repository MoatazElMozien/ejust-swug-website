import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { countPending } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · SWUG Admin" }, robots: { index: false } };

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const pending = user.role === "SUPER_ADMIN" ? await countPending() : 0;
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <AdminNav user={user} pending={pending} />
      <div className="min-w-0">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
