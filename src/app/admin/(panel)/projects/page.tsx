import Image from "next/image";
import Link from "next/link";
import { Boxes, Film, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listProjects, stateCounts } from "@/lib/admin-queries";
import { PUBLISH_STATES, type PublishState } from "@/db/schema";
import { STATE_LABEL } from "@/lib/site";
import { StateBadge } from "@/components/admin/StateBadge";
import { OrderControls } from "@/components/admin/OrderControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  const user = await requireUser();
  const isSuper = user.role === "SUPER_ADMIN";
  const sp = await searchParams;
  const state = PUBLISH_STATES.includes(sp.state as PublishState) ? (sp.state as PublishState) : undefined;
  const [items, counts] = await Promise.all([listProjects(user, state), stateCounts(user)]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const tabs: { key?: PublishState; label: string; n: number }[] = [
    { label: "All", n: total },
    ...(["PENDING", "PUBLISHED", "DRAFT", "REJECTED"] as const).map((k) => ({ key: k, label: STATE_LABEL[k], n: counts[k] })),
  ];
  const canReorder = isSuper && state === "PUBLISHED";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{isSuper ? "Projects" : "My projects"}</h1>
          <p className="mt-1 text-sm text-muted">
            {isSuper ? "Review submissions and edit projects. Star a project to feature it; reorder from the Published tab." : "Projects you've created. Submit a draft when it's ready for review."}
          </p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary">
          <Plus className="size-4" /> New project
        </Link>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => {
          const active = t.key === state;
          return (
            <Link
              key={t.label}
              href={t.key ? `/admin/projects?state=${t.key}` : "/admin/projects"}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm ${
                active ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] ${t.key === "PENDING" && t.n ? "bg-warn/20 text-warn" : "bg-panel-2 text-faint"}`}>{t.n}</span>
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line-strong p-12 text-center text-muted">
          Nothing here yet.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-4 p-3 sm:p-4">
              <Link href={`/admin/projects/${p.id}`} className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md bg-panel-2 sm:w-24">
                {p.cover?.type === "IMAGE" ? (
                  <Image src={p.cover.url} alt="" fill sizes="96px" className="object-cover" />
                ) : p.cover?.poster ? (
                  <Image src={p.cover.poster} alt="" fill sizes="96px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-faint">
                    {p.cover ? <Film className="size-5" /> : <Boxes className="size-5" />}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-brand">
                  {p.title}
                </Link>
                <p className="truncate text-sm text-muted">
                  {p.designer} · {p.category}
                </p>
                <p className="mt-1 text-xs text-faint">
                  {p.author ? `by ${p.author} · ` : ""}updated {p.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="hidden sm:block">
                <StateBadge state={p.state} />
              </div>
              {isSuper && (
                <OrderControls id={p.id} featured={p.featured} canMove={canReorder} first={i === 0} last={i === items.length - 1} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
