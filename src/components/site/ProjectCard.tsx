import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MediaThumb } from "@/components/media/MediaThumb";
import type { ProjectCardData } from "@/lib/queries";

export function ProjectCard({ p, index }: { p: ProjectCardData; index?: number }) {
  return (
    <Link
      href={`/projects/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-line-strong"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-panel-2">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <MediaThumb item={p.media[0]} alt={p.title} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
        {typeof index === "number" && (
          <span className="label absolute left-3 top-3 rounded bg-ink/70 px-2 py-1 text-[10px] text-muted backdrop-blur">
            PRJ-{String(index + 1).padStart(3, "0")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="label text-brand">{p.category}</p>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug">{p.title}</h3>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
        </div>
        <p className="line-clamp-2 text-sm text-muted">{p.summary}</p>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
          <span className="truncate">{p.designer}</span>
          {p.partsCount ? <span className="label shrink-0 text-[10px] text-faint">{p.partsCount} parts</span> : null}
        </div>
      </div>
    </Link>
  );
}
