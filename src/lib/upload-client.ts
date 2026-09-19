"use client";

import { upload } from "@vercel/blob/client";

export type UploadMode = "blob" | "local";

/** Uploads a file and returns its public URL. */
export async function uploadFile(
  file: File | Blob,
  filename: string,
  mode: UploadMode,
  folder: "projects" | "team",
  onProgress?: (pct: number) => void,
): Promise<string> {
  const safe = filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80);
  if (mode === "blob") {
    const res = await upload(`${folder}/${safe}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      multipart: file.size > 20 * 1024 * 1024,
      onUploadProgress: (e) => onProgress?.(e.percentage),
    });
    return res.url;
  }
  const fd = new FormData();
  fd.append("file", file, safe);
  const r = await fetch("/api/upload", { method: "POST", body: fd });
  const j = (await r.json()) as { url?: string; error?: string };
  if (!r.ok || !j.url) throw new Error(j.error || "Upload failed");
  onProgress?.(100);
  return j.url;
}

/** Grabs a still frame (~1s in) from a local video file to use as its poster. */
export function captureVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    const done = (b: Blob | null) => {
      URL.revokeObjectURL(url);
      resolve(b);
    };
    const timer = setTimeout(() => done(null), 8000);
    v.addEventListener("loadedmetadata", () => {
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    });
    v.addEventListener("seeked", () => {
      clearTimeout(timer);
      const w = Math.min(1280, v.videoWidth || 1280);
      const h = Math.round((w / (v.videoWidth || 16)) * (v.videoHeight || 9));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")?.drawImage(v, 0, 0, w, h);
      c.toBlob((b) => done(b), "image/jpeg", 0.82);
    });
    v.addEventListener("error", () => {
      clearTimeout(timer);
      done(null);
    });
  });
}
