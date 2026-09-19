import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ALLOWED_TYPES, blobEnabled, MAX_UPLOAD_BYTES } from "@/lib/storage";

/**
 * Two modes:
 *  • Vercel Blob (production): the browser uploads straight to Blob storage;
 *    this route only issues short-lived upload tokens to signed-in admins.
 *  • Local fallback (dev without BLOB_READ_WRITE_TOKEN): multipart POST, saved to /public/uploads.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (blobEnabled()) {
    try {
      const body = (await request.json()) as HandleUploadBody;
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname) => {
          if (!pathname.startsWith("projects/") && !pathname.startsWith("team/")) throw new Error("Invalid path");
          return {
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: true,
          };
        },
      });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Uploads aren't configured. Connect a Vercel Blob store to this project." },
      { status: 500 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File too large" }, { status: 400 });

  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || "";
  const name = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
