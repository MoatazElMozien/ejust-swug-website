import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProjectCard } from "@/components/site/ProjectCard";
import { getPublishedCategories, getPublishedProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Projects",
  description: "Every SolidWorks design built by E-JUST SWUG members — engines, machines, vehicles and more.",
};

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const [items, categories] = await Promise.all([
    getPublishedProjects({ q: q || undefined, category: category || undefined }),
    getPublishedCategories(),
  ]);
  const total = categories.reduce((a, c) => a + c.n, 0);

  const href = (c: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (c) p.set("category", c);
    const s = p.toString();
    return s ? `/projects?${s}` : "/projects";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <p className="label text-brand">Project archive</p>
      <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">All projects</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Explore every assembly our members have modeled — open any project to see its media, key features and a breakdown of its main parts.
      </p>

      <div className="mt-10 flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0" aria-label="Filter by category">
          <Chip href={href("")} active={!category} label="All" n={total} />
          {categories.map((c) => (
            <Chip key={c.category} href={href(c.category)} active={category === c.category} label={c.category} n={c.n} />
          ))}
        </nav>
        <form action="/projects" className="relative w-full lg:w-72" role="search">
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Search projects or designers" className="input pl-9" aria-label="Search projects" />
        </form>
      </div>

      <p className="label mt-6 text-faint">
        {items.length} result{items.length === 1 ? "" : "s"}
        {q && <> for “{q}”</>}
      </p>

      {items.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-line-strong p-12 text-center text-muted">
          No projects match that search. <Link href="/projects" className="text-fg underline">Clear filters</Link>
        </div>
      )}
    </div>
  );
}

function Chip({ href, active, label, n }: { href: string; active: boolean; label: string; n: number }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active ? "border-brand bg-brand-soft text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      {label}
      <span className="label text-[10px] text-faint">{n}</span>
    </Link>
  );
}
