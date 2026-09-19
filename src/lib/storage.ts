import "server-only";
import { del } from "@vercel/blob";
import { unlink } from "node:fs/promises";
import path from "node:path";

/** Uploads go to Vercel Blob when a token is configured, otherwise to /public/uploads (local dev only). */
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MB
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "video/quicktime"];

/** Best-effort removal of files we own. Legacy /assets files are never touched. */
export async function deleteStoredFiles(urls: string[]) {
  const unique = [...new Set(urls.filter(Boolean))];
  const blobs = unique.filter((u) => /\.blob\.vercel-storage\.com\//.test(u));
  const locals = unique.filter((u) => u.startsWith("/uploads/"));
  try {
    if (blobs.length && blobEnabled()) await del(blobs);
  } catch (e) {
    console.warn("Blob delete failed", e);
  }
  for (const u of locals) {
    const file = path.join(process.cwd(), "public", path.normalize(u).replace(/^(\.\.[/\\])+/, ""));
    await unlink(file).catch(() => {});
  }
}
