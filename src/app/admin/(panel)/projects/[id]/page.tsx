import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { canEdit, getProjectForEdit } from "@/lib/admin-queries";
import { blobEnabled } from "@/lib/storage";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { ReviewPanel } from "@/components/admin/ReviewPanel";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { saved } = await searchParams;
  const p = await getProjectForEdit(Number(id));
  if (!p) notFound();
  const isSuper = user.role === "SUPER_ADMIN";
  if (!isSuper && p.createdById !== user.id) notFound();
  const editable = canEdit(user, p);

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Projects
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{p.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {p.authorName ? <>Created by {p.authorName}</> : "Imported project"}
            {p.reviewerName && <> · last reviewed by {p.reviewerName}</>}
          </p>
        </div>
        <ReviewPanel id={p.id} slug={p.slug} state={p.state} isSuper={isSuper} canDelete={editable} />
      </div>

      {saved && (
        <p className="mt-6 rounded-lg border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
          Project created{p.state === "PENDING" ? " and submitted for review" : p.state === "PUBLISHED" ? " and published" : " as a draft"}.
        </p>
      )}

      {p.state === "REJECTED" && p.reviewNote && (
        <div className="mt-6 flex gap-3 rounded-xl border border-brand/40 bg-brand-soft p-4 text-sm">
          <MessageSquareWarning className="size-5 shrink-0 text-brand" />
          <div>
            <p className="font-medium">Changes requested</p>
            <p className="mt-1 whitespace-pre-line text-muted">{p.reviewNote}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <ProjectForm
          isSuper={isSuper}
          readOnly={!editable}
          uploadMode={blobEnabled() ? "blob" : "local"}
          initial={{
            id: p.id,
            title: p.title,
            designer: p.designer,
            category: p.category,
            summary: p.summary,
            overview: p.overview ?? "",
            principle: p.principle ?? "",
            partsCount: p.partsCount,
            status: p.status,
            featured: p.featured,
            state: p.state,
            media: p.media.map((m) => ({ type: m.type, url: m.url, poster: m.poster, caption: m.caption })),
            features: p.features.map((x) => x.text),
            components: p.components.map((c) => ({ name: c.name, description: c.description })),
          }}
        />
      </div>
    </div>
  );
}
