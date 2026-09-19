import { requireSuperAdmin } from "@/lib/auth";
import { getTeam } from "@/lib/queries";
import { blobEnabled } from "@/lib/storage";
import { TeamEditor } from "./TeamEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

export default async function TeamPage() {
  await requireSuperAdmin();
  const team = await getTeam();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Team</h1>
      <p className="mt-1 text-sm text-muted">
        Board members and leads shown in the “People behind SWUG” section. The section is hidden while this list is empty.
      </p>
      <TeamEditor
        uploadMode={blobEnabled() ? "blob" : "local"}
        initial={team.map((m) => ({ name: m.name, position: m.position, photoUrl: m.photoUrl, linkedinUrl: m.linkedinUrl }))}
      />
    </div>
  );
}
