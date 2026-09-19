"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Camera, Loader2, Plus, Trash2 } from "lucide-react";
import { saveTeam } from "@/app/admin/actions/settings";
import { uploadFile, type UploadMode } from "@/lib/upload-client";

type M = { key: string; name: string; position: string; photoUrl: string | null; linkedinUrl: string | null };
const uid = () => Math.random().toString(36).slice(2);

export function TeamEditor({
  initial,
  uploadMode,
}: {
  initial: Omit<M, "key">[];
  uploadMode: UploadMode;
}) {
  const [list, setList] = useState<M[]>(initial.map((m) => ({ ...m, key: uid() })));
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const upd = (key: string, p: Partial<M>) => setList((l) => l.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const move = (i: number, d: number) =>
    setList((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  async function photo(key: string, file: File) {
    if (!file.type.startsWith("image/")) return setMsg({ error: "Photos must be images." });
    setBusyKey(key);
    try {
      upd(key, { photoUrl: await uploadFile(file, file.name, uploadMode, "team") });
    } catch (e) {
      setMsg({ error: (e as Error).message });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-line bg-panel p-5 sm:p-6">
      {list.length === 0 && <p className="mb-4 text-sm text-muted">No team members yet.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((m, i) => (
          <li key={m.key} className="flex gap-3 rounded-lg border border-line bg-ink p-3">
            <label className="relative grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-md bg-panel-2 text-faint hover:text-fg">
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt="" className="absolute inset-0 size-full object-cover" />
              ) : busyKey === m.key ? null : (
                <Camera className="size-5" />
              )}
              {busyKey === m.key && <Loader2 className="relative size-5 animate-spin" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && photo(m.key, e.target.files[0])} />
              <span className="sr-only">Upload photo</span>
            </label>
            <div className="min-w-0 flex-1 space-y-2">
              <input className="input py-1.5" placeholder="Name" value={m.name} onChange={(e) => upd(m.key, { name: e.target.value })} />
              <input className="input py-1.5" placeholder="Position, e.g. President" value={m.position} onChange={(e) => upd(m.key, { position: e.target.value })} />
              <input className="input py-1.5" placeholder="LinkedIn URL (optional)" value={m.linkedinUrl ?? ""} onChange={(e) => upd(m.key, { linkedinUrl: e.target.value })} />
            </div>
            <div className="flex flex-col">
              <button type="button" className="grid size-8 place-items-center rounded-md text-muted hover:bg-panel-2 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-4" /></button>
              <button type="button" className="grid size-8 place-items-center rounded-md text-muted hover:bg-panel-2 disabled:opacity-30" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-4" /></button>
              <button type="button" className="grid size-8 place-items-center rounded-md text-muted hover:bg-panel-2" onClick={() => setList((l) => l.filter((x) => x.key !== m.key))} aria-label="Remove"><Trash2 className="size-4" /></button>
              {m.photoUrl && (
                <button type="button" className="mt-auto text-[10px] text-faint hover:text-fg" onClick={() => upd(m.key, { photoUrl: null })}>
                  No photo
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => setList((l) => [...l, { key: uid(), name: "", position: "", photoUrl: null, linkedinUrl: null }])}>
          <Plus className="size-4" /> Add member
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending || !!busyKey}
          onClick={() =>
            start(async () =>
              setMsg(await saveTeam(list.map(({ name, position, photoUrl, linkedinUrl }) => ({ name, position, photoUrl, linkedinUrl })))),
            )
          }
        >
          {pending ? "Saving…" : "Save team"}
        </button>
        {msg?.error && <p className="text-sm text-[#ff8595]">{msg.error}</p>}
        {msg?.ok && <p className="text-sm text-ok">{msg.ok}</p>}
      </div>
    </div>
  );
}
