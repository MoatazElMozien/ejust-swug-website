import Link from "next/link";
import { ArrowRight, Plus, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listProjects, stateCounts } from "@/lib/admin-queries";
import { getSiteStats } from "@/lib/queries";
import { StateBadge } from "@/components/admin/StateBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const isSuper = user.role === "SUPER_ADMIN";
  const sp = await searchParams;
  const [counts, stats, queue, mine] = await Promise.all([
    stateCounts(user),
    getSiteStats(),
    isSuper ? listProjects(user, "PENDING") : Promise.resolve([]),
    listProjects(user, undefined, true),
  ]);
  const myOpen = mine.filter((p) => p.state !== "PUBLISHED").slice(0, 6);

  const cards = isSuper
    ? [
        { k: "Live projects", v: stats.projects, href: "/admin/projects?state=PUBLISHED" },
        { k: "Awaiting review", v: counts.PENDING, href: "/admin/projects?state=PENDING", hot: counts.PENDING > 0 },
        { k: "Drafts", v: counts.DRAFT, href: "/admin/projects?state=DRAFT" },
        { k: "Parts modeled", v: stats.parts.toLocaleString("en-US") },
      ]
    : [
        { k: "My drafts", v: counts.DRAFT, href: "/admin/projects?state=DRAFT" },
        { k: "In review", v: counts.PENDING, href: "/admin/projects?state=PENDING" },
        { k: "Changes requested", v: counts.REJECTED, href: "/admin/projects?state=REJECTED", hot: counts.REJECTED > 0 },
        { k: "Published", v: counts.PUBLISHED, href: "/admin/projects?state=PUBLISHED" },
      ];

  return (
    <div className="space-y-10">
      {sp.denied && (
        <div className="flex items-center gap-3 rounded-lg border border-brand/40 bg-brand-soft p-3 text-sm">
          <ShieldAlert className="size-4 text-brand" /> That page is for super admins only.
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-faint">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Hi, {user.name.split(" ")[0]}</h1>
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary">
          <Plus className="size-4" /> New project
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="label text-faint">{c.k}</p>
              <p className={`mt-2 font-display text-3xl font-semibold ${"hot" in c && c.hot ? "text-warn" : ""}`}>{c.v}</p>
            </>
          );
          return "href" in c && c.href ? (
            <Link key={c.k} href={c.href} className="rounded-xl border border-line bg-panel p-5 transition-colors hover:border-line-strong">
              {inner}
            </Link>
          ) : (
            <div key={c.k} className="rounded-xl border border-line bg-panel p-5">{inner}</div>
          );
        })}
      </div>

      {isSuper && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Review queue</h2>
            <Link href="/admin/projects?state=PENDING" className="text-sm text-muted hover:text-fg">View all</Link>
          </div>
          {queue.length ? (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
              {queue.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-panel-2/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-muted">Submitted by {p.author ?? "unknown"} · {p.designer}</p>
                    </div>
                    <span className="text-sm text-brand">Review</span>
                    <ArrowRight className="size-4 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-muted">
              Nothing waiting for review.
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-semibold">Your work in progress</h2>
        {myOpen.length ? (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
            {myOpen.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-panel-2/50">
                  <p className="min-w-0 flex-1 truncate font-medium">{p.title}</p>
                  <StateBadge state={p.state} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-muted">
            No drafts. <Link href="/admin/projects/new" className="text-fg underline">Start a new project</Link>.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-panel p-5 text-sm text-muted">
        <h2 className="font-medium text-fg">How publishing works</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>An editor creates a project and saves it as a <b className="text-fg">draft</b>.</li>
          <li>When it&apos;s ready, they <b className="text-fg">submit it for review</b>.</li>
          <li>A super admin either <b className="text-fg">publishes</b> it or <b className="text-fg">requests changes</b> with a note.</li>
        </ol>
      </section>
    </div>
  );
}
