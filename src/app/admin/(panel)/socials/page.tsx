import { requireSuperAdmin } from "@/lib/auth";
import { getSocialLinks } from "@/lib/queries";
import { SocialsEditor } from "./SocialsEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Social links" };

export default async function SocialsPage() {
  await requireSuperAdmin();
  const links = await getSocialLinks();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Social links</h1>
      <p className="mt-1 text-sm text-muted">Shown in the site footer and the “Join & connect” section, in this order.</p>
      <SocialsEditor initial={links.map((l) => ({ platform: l.platform, url: l.url }))} />
    </div>
  );
}
