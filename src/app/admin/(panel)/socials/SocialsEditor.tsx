"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveSocials } from "@/app/admin/actions/settings";
import { SOCIAL_PLATFORMS } from "@/lib/site";
import { SocialIcon } from "@/components/SocialIcon";

type L = { key: string; platform: string; url: string };
const uid = () => Math.random().toString(36).slice(2);

export function SocialsEditor({ initial }: { initial: { platform: string; url: string }[] }) {
  const [list, setList] = useState<L[]>(initial.map((l) => ({ ...l, key: uid() })));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const upd = (key: string, p: Partial<L>) => setList((l) => l.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const move = (i: number, d: number) =>
    setList((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  return (
    <div className="mt-8 rounded-xl border border-line bg-panel p-5 sm:p-6">
      {list.length === 0 && <p className="mb-4 text-sm text-muted">No links yet.</p>}
      <ul className="space-y-2">
        {list.map((l, i) => (
          <li key={l.key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-line text-muted">
              <SocialIcon platform={l.platform} />
            </span>
            <select className="input w-40 shrink-0" value={l.platform} onChange={(e) => upd(l.key, { platform: e.target.value })} aria-label="Platform">
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <input
              className="input min-w-0 flex-1"
              value={l.url}
              onChange={(e) => upd(l.key, { url: e.target.value })}
              placeholder={l.platform === "Email" ? "swug@example.com" : "https://…"}
              aria-label="Link"
            />
            <button type="button" className="grid size-9 place-items-center rounded-md text-muted hover:bg-panel-2 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-4" /></button>
            <button type="button" className="grid size-9 place-items-center rounded-md text-muted hover:bg-panel-2 disabled:opacity-30" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-4" /></button>
            <button type="button" className="grid size-9 place-items-center rounded-md text-muted hover:bg-panel-2" onClick={() => setList((x) => x.filter((y) => y.key !== l.key))} aria-label="Remove"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => setList((l) => [...l, { key: uid(), platform: SOCIAL_PLATFORMS.find((p) => !l.some((x) => x.platform === p)) ?? "Website", url: "" }])}>
          <Plus className="size-4" /> Add link
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() => start(async () => setMsg(await saveSocials(list.map(({ platform, url }) => ({ platform, url })))))}
        >
          {pending ? "Saving…" : "Save links"}
        </button>
        {msg?.error && <p className="text-sm text-[#ff8595]">{msg.error}</p>}
        {msg?.ok && <p className="text-sm text-ok">{msg.ok}</p>}
      </div>
    </div>
  );
}
