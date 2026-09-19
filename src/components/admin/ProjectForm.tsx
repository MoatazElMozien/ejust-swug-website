"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Film,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { saveProject, type ProjectInput, type SaveIntent } from "@/app/admin/actions/projects";
import { CATEGORIES, STATE_LABEL } from "@/lib/site";
import { captureVideoPoster, uploadFile, type UploadMode } from "@/lib/upload-client";
import type { PublishState } from "@/db/schema";
import { StateBadge } from "./StateBadge";

type MediaItem = { key: string; type: "IMAGE" | "VIDEO"; url: string; poster: string | null; caption: string };
type Uploading = { key: string; name: string; pct: number; error?: string };

export type ProjectFormInitial = {
  id?: number;
  title: string;
  designer: string;
  category: string;
  summary: string;
  overview: string;
  principle: string;
  partsCount: number | null;
  status: "COMPLETE" | "IN_PROGRESS" | "CONCEPT";
  featured: boolean;
  state: PublishState;
  media: { type: "IMAGE" | "VIDEO"; url: string; poster: string | null; caption: string | null }[];
  features: string[];
  components: { name: string; description: string }[];
};

const uid = () => Math.random().toString(36).slice(2);

export function ProjectForm({
  initial,
  isSuper,
  readOnly,
  uploadMode,
}: {
  initial: ProjectFormInitial;
  isSuper: boolean;
  readOnly: boolean;
  uploadMode: UploadMode;
}) {
  const router = useRouter();
  const [f, setF] = useState({
    title: initial.title,
    designer: initial.designer,
    category: initial.category,
    summary: initial.summary,
    overview: initial.overview,
    principle: initial.principle,
    partsCount: initial.partsCount === null ? "" : String(initial.partsCount),
    status: initial.status,
    featured: initial.featured,
  });
  const [media, setMedia] = useState<MediaItem[]>(
    initial.media.map((m) => ({ ...m, key: uid(), caption: m.caption ?? "" })),
  );
  const [feats, setFeats] = useState<{ key: string; text: string }[]>(
    (initial.features.length ? initial.features : [""]).map((text) => ({ key: uid(), text })),
  );
  const [comps, setComps] = useState<{ key: string; name: string; description: string }[]>(
    initial.components.map((c) => ({ ...c, key: uid() })),
  );
  const [uploads, setUploads] = useState<Uploading[]>([]);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const busy = pending || uploads.some((u) => !u.error);
  const state = initial.state;

  async function addFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      if (!isVideo && !file.type.startsWith("image/")) {
        setMsg({ kind: "err", text: `${file.name}: only images and videos are allowed.` });
        continue;
      }
      const key = uid();
      setUploads((u) => [...u, { key, name: file.name, pct: 0 }]);
      try {
        let poster: string | null = null;
        if (isVideo) {
          const still = await captureVideoPoster(file);
          if (still) poster = await uploadFile(still, file.name.replace(/\.\w+$/, "") + "-poster.jpg", uploadMode, "projects");
        }
        const url = await uploadFile(file, file.name, uploadMode, "projects", (pct) =>
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, pct } : x))),
        );
        setMedia((m) => [...m, { key, type: isVideo ? "VIDEO" : "IMAGE", url, poster, caption: "" }]);
        setUploads((u) => u.filter((x) => x.key !== key));
      } catch (e) {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: (e as Error).message } : x)));
      }
    }
  }

  function move<T>(list: T[], i: number, d: -1 | 1): T[] {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }

  function submit(intent: SaveIntent) {
    setMsg(null);
    const payload: ProjectInput = {
      id: initial.id,
      title: f.title,
      designer: f.designer,
      category: f.category,
      summary: f.summary,
      overview: f.overview,
      principle: f.principle,
      partsCount: f.partsCount === "" ? null : Number(f.partsCount),
      status: f.status,
      featured: isSuper ? f.featured : undefined,
      media: media.map(({ type, url, poster, caption }) => ({ type, url, poster, caption })),
      features: feats.map((x) => x.text),
      components: comps.map(({ name, description }) => ({ name, description })),
    };
    start(async () => {
      const r = await saveProject(payload, intent);
      if (!r.ok) return setMsg({ kind: "err", text: r.error });
      setMsg({ kind: "ok", text: r.message });
      if (!initial.id) router.replace(`/admin/projects/${r.id}?saved=1`);
      else router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("save");
      }}
      className="space-y-8 pb-28"
    >
      <fieldset disabled={readOnly} className="space-y-8 disabled:opacity-80">
        {/* ── Basics ── */}
        <Section title="Basics" hint="What visitors see on the project card.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project title" required>
              <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} required maxLength={160} />
            </Field>
            <Field label="Designer(s)" required hint="e.g. Eng. Bahaa Ali, or a team name">
              <input className="input" value={f.designer} onChange={(e) => set("designer", e.target.value)} required maxLength={160} />
            </Field>
            <Field label="Discipline" required>
              <input className="input" list="categories" value={f.category} onChange={(e) => set("category", e.target.value)} required maxLength={80} placeholder="Pick or type a new one" />
              <datalist id="categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Part count" hint="Leave empty if unknown">
                <input className="input" type="number" min={0} value={f.partsCount} onChange={(e) => set("partsCount", e.target.value)} />
              </Field>
              <Field label="Status">
                <select className="input" value={f.status} onChange={(e) => set("status", e.target.value as typeof f.status)}>
                  <option value="COMPLETE">Complete</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="CONCEPT">Concept</option>
                </select>
              </Field>
            </div>
          </div>
          {isSuper && (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
              Feature on the home page
            </label>
          )}
        </Section>

        {/* ── Description ── */}
        <Section title="Description">
          <div className="space-y-4">
            <Field label="Summary" required hint="1–3 sentences shown on cards and at the top of the project page.">
              <textarea className="input" value={f.summary} onChange={(e) => set("summary", e.target.value)} required maxLength={2000} />
            </Field>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Overview" hint="Optional — longer technical overview.">
                <textarea className="input min-h-40" value={f.overview} onChange={(e) => set("overview", e.target.value)} maxLength={5000} />
              </Field>
              <Field label="Working principle" hint="Optional — how the design works.">
                <textarea className="input min-h-40" value={f.principle} onChange={(e) => set("principle", e.target.value)} maxLength={5000} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Media ── */}
        <Section title="Images & videos" hint="The first item is used as the cover. JPG, PNG, WebP, MP4, WebM or MOV.">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (!readOnly) addFiles(e.dataTransfer.files);
            }}
            onClick={() => !readOnly && fileRef.current?.click()}
            className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
              drag ? "border-brand bg-brand-soft" : "border-line-strong hover:border-muted"
            }`}
          >
            <UploadCloud className="size-7 text-muted" />
            <p className="mt-2 text-sm">Drop files here or <span className="text-brand">browse</span></p>
            <p className="text-xs text-faint">Up to 200 MB per file</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {uploads.length > 0 && (
            <ul className="mt-3 space-y-2">
              {uploads.map((u) => (
                <li key={u.key} className="rounded-md border border-line p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{u.name}</span>
                    {u.error ? (
                      <button type="button" className="text-xs text-muted hover:text-fg" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}>
                        Dismiss
                      </button>
                    ) : (
                      <span className="label text-[10px] text-faint">{Math.round(u.pct)}%</span>
                    )}
                  </div>
                  {u.error ? (
                    <p className="mt-1 text-xs text-[#ff8595]">{u.error}</p>
                  ) : (
                    <div className="mt-2 h-1 overflow-hidden rounded bg-panel-2">
                      <div className="h-full bg-brand transition-all" style={{ width: `${Math.max(4, u.pct)}%` }} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {media.length > 0 && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((m, i) => (
                <li key={m.key} className="overflow-hidden rounded-lg border border-line bg-ink">
                  <div className="relative aspect-video bg-panel-2">
                    {m.type === "VIDEO" ? (
                      <video src={m.url} poster={m.poster ?? undefined} muted playsInline preload="metadata" className="size-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="size-full object-cover" />
                    )}
                    <span className="label absolute left-2 top-2 flex items-center gap-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] text-muted">
                      {m.type === "VIDEO" ? <Film className="size-3" /> : <ImageIcon className="size-3" />}
                      {i === 0 ? "Cover" : `#${i + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 p-2">
                    <input
                      className="input py-1.5 text-xs"
                      placeholder="Caption (optional)"
                      value={m.caption}
                      maxLength={255}
                      onChange={(e) => setMedia((l) => l.map((x) => (x.key === m.key ? { ...x, caption: e.target.value } : x)))}
                    />
                    <IconBtn label="Move earlier" onClick={() => setMedia((l) => move(l, i, -1))} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
                    <IconBtn label="Move later" onClick={() => setMedia((l) => move(l, i, 1))} disabled={i === media.length - 1}><ArrowDown className="size-3.5" /></IconBtn>
                    <IconBtn label="Remove" onClick={() => setMedia((l) => l.filter((x) => x.key !== m.key))}><Trash2 className="size-3.5" /></IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── Features ── */}
        <Section title="Key design features" hint="Short bullet points (up to 12).">
          <ul className="space-y-2">
            {feats.map((x, i) => (
              <li key={x.key} className="flex items-center gap-1">
                <span className="label w-7 shrink-0 text-faint">{String(i + 1).padStart(2, "0")}</span>
                <input
                  className="input"
                  value={x.text}
                  maxLength={400}
                  placeholder="e.g. Zero-radius differential track drive"
                  onChange={(e) => setFeats((l) => l.map((y) => (y.key === x.key ? { ...y, text: e.target.value } : y)))}
                />
                <IconBtn label="Move up" onClick={() => setFeats((l) => move(l, i, -1))} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
                <IconBtn label="Move down" onClick={() => setFeats((l) => move(l, i, 1))} disabled={i === feats.length - 1}><ArrowDown className="size-3.5" /></IconBtn>
                <IconBtn label="Remove" onClick={() => setFeats((l) => l.filter((y) => y.key !== x.key))}><Trash2 className="size-3.5" /></IconBtn>
              </li>
            ))}
          </ul>
          {feats.length < 12 && (
            <button type="button" className="btn btn-ghost mt-3" onClick={() => setFeats((l) => [...l, { key: uid(), text: "" }])}>
              <Plus className="size-4" /> Add feature
            </button>
          )}
        </Section>

        {/* ── Parts breakdown ── */}
        <Section title="Parts breakdown" hint="Optional — the main components / sub-assemblies and what each does.">
          <ul className="space-y-3">
            {comps.map((c, i) => (
              <li key={c.key} className="rounded-lg border border-line bg-ink p-3">
                <div className="flex items-center gap-1">
                  <span className="label w-7 shrink-0 text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <input
                    className="input"
                    placeholder="Component name, e.g. Crankshaft"
                    value={c.name}
                    maxLength={200}
                    onChange={(e) => setComps((l) => l.map((y) => (y.key === c.key ? { ...y, name: e.target.value } : y)))}
                  />
                  <IconBtn label="Move up" onClick={() => setComps((l) => move(l, i, -1))} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
                  <IconBtn label="Move down" onClick={() => setComps((l) => move(l, i, 1))} disabled={i === comps.length - 1}><ArrowDown className="size-3.5" /></IconBtn>
                  <IconBtn label="Remove" onClick={() => setComps((l) => l.filter((y) => y.key !== c.key))}><Trash2 className="size-3.5" /></IconBtn>
                </div>
                <textarea
                  className="input mt-2 min-h-20"
                  placeholder="What this part does"
                  value={c.description}
                  maxLength={2000}
                  onChange={(e) => setComps((l) => l.map((y) => (y.key === c.key ? { ...y, description: e.target.value } : y)))}
                />
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost mt-3" onClick={() => setComps((l) => [...l, { key: uid(), name: "", description: "" }])}>
            <Plus className="size-4" /> Add component
          </button>
        </Section>
      </fieldset>

      {/* ── Action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/90 backdrop-blur lg:left-[240px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          {initial.id ? <StateBadge state={state} /> : <span className="label text-faint">New project</span>}
          {msg && (
            <p role="status" className={`text-sm ${msg.kind === "ok" ? "text-ok" : "text-[#ff8595]"}`}>
              {msg.text}
            </p>
          )}
          <div className="ml-auto flex gap-2">
            {readOnly ? (
              <span className="text-sm text-muted">
                {state === "PENDING" ? "Waiting for a super admin to review." : "Published projects can only be changed by a super admin."}
              </span>
            ) : isSuper ? (
              <>
                <button type="submit" className="btn btn-ghost" disabled={busy}>
                  {pending && <Loader2 className="size-4 animate-spin" />}{" "}
                  {state === "PUBLISHED" ? "Save changes" : state === "DRAFT" ? "Save draft" : "Save"}
                </button>
                {state !== "PUBLISHED" && (
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit("publish")}>
                    Publish
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="submit" className="btn btn-ghost" disabled={busy}>
                  {pending && <Loader2 className="size-4 animate-spin" />} Save draft
                </button>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit("submit")}>
                  Submit for review
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <span className="sr-only">{STATE_LABEL[state]}</span>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-panel-2 hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  );
}
