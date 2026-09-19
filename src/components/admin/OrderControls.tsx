"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { moveProject, toggleFeatured } from "@/app/admin/actions/projects";

export function OrderControls({
  id,
  featured,
  canMove,
  first,
  last,
}: {
  id: number;
  featured: boolean;
  canMove: boolean;
  first: boolean;
  last: boolean;
}) {
  const [pending, start] = useTransition();
  const cls = "grid size-8 place-items-center rounded-md text-muted hover:bg-panel-2 hover:text-fg disabled:opacity-30";
  return (
    <div className="flex items-center gap-0.5">
      <button
        className={cls}
        disabled={pending}
        onClick={() => start(() => toggleFeatured(id))}
        aria-label={featured ? "Remove from home page" : "Feature on home page"}
        title={featured ? "Featured on home page" : "Feature on home page"}
      >
        <Star className={`size-4 ${featured ? "fill-warn text-warn" : ""}`} />
      </button>
      {canMove && (
        <>
          <button className={cls} disabled={pending || first} onClick={() => start(() => moveProject(id, "up"))} aria-label="Move up" title="Move up">
            <ArrowUp className="size-4" />
          </button>
          <button className={cls} disabled={pending || last} onClick={() => start(() => moveProject(id, "down"))} aria-label="Move down" title="Move down">
            <ArrowDown className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
