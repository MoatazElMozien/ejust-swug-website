"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, EyeOff, MessageSquareWarning, Trash2 } from "lucide-react";
import {
  deleteProject,
  publishProject,
  requestChanges,
  unpublishProject,
} from "@/app/admin/actions/projects";
import type { PublishState } from "@/db/schema";

export function ReviewPanel({
  id,
  state,
  isSuper,
  canDelete,
  slug,
}: {
  id: number;
  state: PublishState;
  isSuper: boolean;
  canDelete: boolean;
  slug: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const run = (fn: () => Promise<unknown>) => start(async () => {
    setError("");
    await fn();
    router.refresh();
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === "PUBLISHED" && (
        <a href={`/projects/${slug}`} target="_blank" className="btn btn-ghost">
          View live
        </a>
      )}
      {isSuper && state === "PENDING" && (
        <>
          <button className="btn btn-primary" disabled={pending} onClick={() => run(() => publishProject(id))}>
            <Check className="size-4" /> Approve & publish
          </button>
          <button className="btn btn-ghost" disabled={pending} onClick={() => setAsking((v) => !v)}>
            <MessageSquareWarning className="size-4" /> Request changes
          </button>
        </>
      )}
      {isSuper && state === "PUBLISHED" && (
        <button className="btn btn-ghost" disabled={pending} onClick={() => run(() => unpublishProject(id))}>
          <EyeOff className="size-4" /> Unpublish
        </button>
      )}
      {canDelete && (
        <button
          className="btn btn-danger"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this project permanently? Its uploaded files will be removed too.")) return;
            start(async () => {
              const r = await deleteProject(id);
              if (!r.ok) return setError(r.error);
              router.replace("/admin/projects");
            });
          }}
        >
          <Trash2 className="size-4" /> Delete
        </button>
      )}
      {error && <p className="w-full text-sm text-[#ff8595]">{error}</p>}
      {asking && (
        <div className="w-full rounded-lg border border-line bg-panel p-4">
          <label className="block text-sm">
            What should the editor change?
            <textarea className="input mt-2 min-h-24" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please add a clearer cover render and fill in the part count." />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setAsking(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={pending}
              onClick={() => run(async () => { await requestChanges(id, note); setAsking(false); })}
            >
              Send back to editor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
