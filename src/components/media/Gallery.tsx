"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { AutoVideo } from "./AutoVideo";

type M = { id: number; type: "IMAGE" | "VIDEO"; url: string; poster: string | null; caption: string | null };

export function Gallery({ items, title }: { items: M[]; title: string }) {
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const cur = items[i];
  const go = (d: number) => setI((v) => (v + d + items.length) % items.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-panel-2">
        {cur.type === "VIDEO" ? (
          <AutoVideo key={cur.url} src={cur.url} poster={cur.poster} controls className="absolute inset-0 size-full bg-black object-contain" />
        ) : (
          <>
            {/* blurred fill keeps white-background renders and dark renders looking consistent */}
            <Image src={cur.url} alt="" fill sizes="60vw" className="scale-110 object-cover opacity-40 blur-2xl" aria-hidden />
            <Image
              key={cur.url}
              src={cur.url}
              alt={cur.caption || `${title} — image ${i + 1}`}
              fill
              sizes="(min-width:1024px) 60vw, 100vw"
              className="object-contain"
              priority={i === 0}
            />
          </>
        )}
        {items.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-ink/70 backdrop-blur hover:bg-ink">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-ink/70 backdrop-blur hover:bg-ink">
              <ChevronRight className="size-5" />
            </button>
            <span className="label absolute bottom-3 right-3 rounded bg-ink/70 px-2 py-1 text-[10px] text-muted">
              {i + 1} / {items.length}
            </span>
          </>
        )}
      </div>
      {cur.caption && <p className="text-sm text-muted">{cur.caption}</p>}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((m, k) => (
            <button
              key={m.id}
              onClick={() => setI(k)}
              aria-label={`Show media ${k + 1}`}
              className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md border ${k === i ? "border-brand" : "border-line opacity-60 hover:opacity-100"}`}
            >
              {m.type === "VIDEO" ? (
                <>
                  {m.poster && <Image src={m.poster} alt="" fill sizes="96px" className="object-cover" />}
                  <span className="absolute inset-0 grid place-items-center bg-ink/40">
                    <Play className="size-5 text-fg" />
                  </span>
                </>
              ) : (
                <Image src={m.url} alt="" fill sizes="96px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
