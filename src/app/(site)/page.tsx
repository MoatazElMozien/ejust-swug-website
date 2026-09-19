import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/site/ProjectCard";
import { MediaThumb } from "@/components/media/MediaThumb";
import { SocialIcon, socialHref } from "@/components/SocialIcon";
import {
  getPublishedCategories,
  getPublishedProjects,
  getSiteStats,
  getSocialLinks,
  getTeam,
} from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, stats, categories, team, socials] = await Promise.all([
    getPublishedProjects({ featured: true }),
    getSiteStats(),
    getPublishedCategories(),
    getTeam(),
    getSocialLinks(),
  ]);
  const hero = featured.find((p) => p.media[0]?.type === "VIDEO") ?? featured[0];
  const grid = featured.slice(0, 6);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-blueprint absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]" />
        <div className="absolute -left-40 top-10 size-[520px] rounded-full bg-brand/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-fade-up">
            <p className="label mb-6 flex items-center gap-3 text-muted">
              <span className="h-px w-8 bg-brand" /> {site.university}
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              We design.
              <br />
              We build.
              <br />
              <span className="text-brand">We engineer.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">{site.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projects" className="btn btn-primary px-5 py-3">
                Explore our projects <ArrowRight className="size-4" />
              </Link>
              <Link href="#about" className="btn btn-ghost px-5 py-3">
                About the club
              </Link>
            </div>
          </div>

          {hero && (
            <Link
              href={`/projects/${hero.slug}`}
              className="group relative block animate-fade-up [animation-delay:150ms]"
              aria-label={`Featured: ${hero.title}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line-strong bg-panel">
                <MediaThumb item={hero.media[0]} alt={hero.title} sizes="(min-width:1024px) 45vw, 100vw" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink via-ink/60 to-transparent p-5 pt-16">
                  <div>
                    <p className="label text-brand">Featured build</p>
                    <p className="mt-1 font-display text-xl font-semibold">{hero.title}</p>
                    <p className="text-sm text-muted">{hero.designer}</p>
                  </div>
                  {hero.partsCount ? (
                    <p className="text-right">
                      <span className="block font-display text-3xl font-semibold">{hero.partsCount}</span>
                      <span className="label text-[10px] text-muted">parts</span>
                    </p>
                  ) : null}
                </div>
              </div>
              {/* drawing-frame corner marks */}
              {["-left-2 -top-2 border-l border-t", "-right-2 -top-2 border-r border-t", "-bottom-2 -left-2 border-b border-l", "-bottom-2 -right-2 border-b border-r"].map((c) => (
                <span key={c} className={`absolute size-5 border-brand ${c}`} />
              ))}
            </Link>
          )}
        </div>

        {/* stats */}
        <div className="relative border-t border-line">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
            {[
              { k: "Projects", v: stats.projects },
              { k: "Parts modeled", v: stats.parts.toLocaleString("en-US") },
              { k: "Contributors", v: stats.designers },
              { k: "Disciplines", v: categories.length },
            ].map((s, i) => (
              <div key={s.k} className={`py-6 ${i % 2 ? "pl-6" : ""} md:pl-6 ${i ? "md:border-l" : "md:pl-0"} border-line ${i % 2 ? "border-l" : ""}`}>
                <dt className="label text-faint">{s.k}</dt>
                <dd className="mt-1 font-display text-3xl font-semibold">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Featured projects ───────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-brand">Featured work</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Built by our members</h2>
          </div>
          <Link href="/projects" className="btn btn-ghost">
            View all {stats.projects} projects <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* ── About ───────────────────────────────────────── */}
      <section id="about" className="scroll-mt-16 border-y border-line bg-panel">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="label text-brand">About the club</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              From first sketch to full assembly.
            </h2>
            <div className="mt-6 space-y-4 text-muted">
              {site.about.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-4">
              <Image src="/assets/images/logo.png" alt="SWUG logo" width={72} height={72} className="size-16 object-contain" />
              <p className="text-sm text-faint">
                {site.fullName}
                <br />
                {site.location}
              </p>
            </div>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {site.pillars.map((p, i) => (
              <li key={p.title} className="bg-panel p-6">
                <span className="label text-brand">0{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Disciplines ─────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="label text-brand">Disciplines</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Browse by field</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c.category}
                href={`/projects?category=${encodeURIComponent(c.category)}`}
                className="group flex items-center gap-3 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-brand"
              >
                {c.category}
                <span className="label text-[10px] text-faint group-hover:text-brand">{c.n}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Team ────────────────────────────────────────── */}
      {team.length > 0 && (
        <section id="team" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <p className="label text-brand">The team</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">People behind SWUG</h2>
            <ul className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {team.map((m) => (
                <li key={m.id} className="rounded-xl border border-line bg-panel p-4">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-panel-2">
                    {m.photoUrl ? (
                      <Image src={m.photoUrl} alt={m.name} fill sizes="200px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center font-display text-3xl text-faint">
                        {m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-medium">{m.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted">{m.position}</p>
                    {m.linkedinUrl && (
                      <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`} className="text-faint hover:text-fg">
                        <SocialIcon platform="LinkedIn" className="size-4" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Connect ─────────────────────────────────────── */}
      <section id="connect" className="scroll-mt-16 border-t border-line">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-20 sm:px-6">
          <div className="relative rounded-2xl border border-line bg-panel p-8 sm:p-12">
            <div className="bg-blueprint absolute inset-0 rounded-2xl opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <p className="label text-brand">Join & connect</p>
                <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Want to design with us?</h2>
                <p className="mt-4 max-w-lg text-muted">
                  Follow SWUG for workshops, design challenges and new member calls. Every project on this site started with a student who wanted to build something real.
                </p>
              </div>
              {socials.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {socials.map((s) => (
                    <li key={s.id}>
                      <a
                        href={socialHref(s.platform, s.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-line bg-ink/60 px-4 py-3 transition-colors hover:border-brand"
                      >
                        <SocialIcon platform={s.platform} className="size-5" />
                        <span className="text-sm font-medium">{s.platform}</span>
                        <ArrowRight className="ml-auto size-4 text-faint" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-faint">Social links will appear here once added from the admin panel.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
