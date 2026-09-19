import type { PublishState } from "@/db/schema";
import { STATE_LABEL } from "@/lib/site";

const STYLE: Record<PublishState, string> = {
  DRAFT: "bg-panel-2 text-muted",
  PENDING: "bg-warn/15 text-warn",
  PUBLISHED: "bg-ok/15 text-ok",
  REJECTED: "bg-brand-soft text-[#ff8595]",
};

export function StateBadge({ state }: { state: PublishState }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLE[state]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATE_LABEL[state]}
    </span>
  );
}
