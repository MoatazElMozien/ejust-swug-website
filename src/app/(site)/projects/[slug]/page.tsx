import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Gallery } from "@/components/media/Gallery";
import { getNeighbours, getPublishedProject } from "@/lib/queries";
import { STATUS_LABEL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedProject(slug);
  if (!p) return { title: "Project not found" };
  const img = p.media.find((m) => m.type === "IMAGE");
  return {
    title: p.title,
    description: p.summary.slice(0, 160),
    openGraph: { title: p.title, description: p.summary.slice(0, 160), images: img ? [img.url] : undefined },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = await getPublishedProject(slug);
  if (!p) notFound();
  const { prev, next } = await getNeighbours(p.id);

  const specs = [
    { k: "Designer", v: p.designer },
    { k: "Discipline", v: p.category },
    { k: "Part count", v: p.partsCount ? p.partsCount.toLocaleString("en-US") : "—" },
    { k: "Status", v: STATUS_LABEL[p.status] },
  ];

  return (
    <article>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> All projects
        </Link>
      </div>

      <header className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <Gallery items={p.media} title={p.title} />
        </div>
        <div className="flex flex-col">
          <p className="label text-brand">{p.category}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{p.title}</h1>
          <p className="mt-4 text-muted">{p.summary}</p>
          <dl className="mt-8 divide-y divide-line rounded-xl border border-line bg-panel">
            {specs.map((s) => (
              <div key={s.k} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="label text-faint">{s.k}</dt>
                <dd className="text-right text-sm font-medium">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-16 px-4 pb-20 sm:px-6">
        {(p.overview || p.principle) && (
          <section className="grid gap-10 border-t border-line pt-12 lg:grid-cols-2">
            {p.overview && (
              <div>
                <h2 className="label text-brand">Overview</h2>
                <p className="mt-4 leading-relaxed text-muted">{p.overview}</p>
              </div>
            )}
            {p.principle && (
              <div>
                <h2 className="label text-brand">Working principle</h2>
                <p className="mt-4 leading-relaxed text-muted">{p.principle}</p>
              </div>
            )}
          </section>
        )}

        {p.features.length > 0 && (
          <section className="border-t border-line pt-12">
            <h2 className="font-display text-2xl font-semibold">Key design features</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {p.features.map((f) => (
                <li key={f.id} className="flex gap-3 rounded-lg border border-line bg-panel p-4 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.components.length > 0 && (
          <section className="border-t border-line pt-12">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold">Parts breakdown</h2>
              <p className="label text-faint">{p.components.length} main components</p>
            </div>
            <ol className="mt-6 overflow-hidden rounded-xl border border-line">
              {p.components.map((c, i) => (
                <li key={c.id} className="grid gap-2 border-b border-line bg-panel px-5 py-4 last:border-b-0 sm:grid-cols-[3rem_16rem_1fr] sm:gap-6">
                  <span className="label text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-medium">{c.name}</h3>
                  <p className="text-sm text-muted">{c.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {prev && next && (
          <nav className="grid gap-3 border-t border-line pt-10 sm:grid-cols-2" aria-label="More projects">
            <Link href={`/projects/${prev.slug}`} className="group rounded-xl border border-line p-5 hover:border-line-strong">
              <span className="label flex items-center gap-2 text-faint"><ArrowLeft className="size-3" /> Previous</span>
              <span className="mt-2 block font-display text-lg font-semibold group-hover:text-brand">{prev.title}</span>
            </Link>
            <Link href={`/projects/${next.slug}`} className="group rounded-xl border border-line p-5 text-right hover:border-line-strong">
              <span className="label flex items-center justify-end gap-2 text-faint">Next <ArrowRight className="size-3" /></span>
              <span className="mt-2 block font-display text-lg font-semibold group-hover:text-brand">{next.title}</span>
            </Link>
          </nav>
        )}
      </div>
    </article>
  );
}
