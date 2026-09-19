import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { blobEnabled } from "@/lib/storage";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const user = await requireUser();
  const isSuper = user.role === "SUPER_ADMIN";
  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Projects
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">New project</h1>
      <p className="mt-1 text-sm text-muted">
        {isSuper
          ? "Save as a draft, or publish straight to the site."
          : "Save a draft while you work, then submit it — a super admin reviews every project before it goes live."}
      </p>
      <div className="mt-8">
        <ProjectForm
          isSuper={isSuper}
          readOnly={false}
          uploadMode={blobEnabled() ? "blob" : "local"}
          initial={{
            title: "",
            designer: "",
            category: "",
            summary: "",
            overview: "",
            principle: "",
            partsCount: null,
            status: "COMPLETE",
            featured: false,
            state: "DRAFT",
            media: [],
            features: [],
            components: [],
          }}
        />
      </div>
    </div>
  );
}
