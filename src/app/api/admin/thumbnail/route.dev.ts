import { guard } from "@/lib/server/admin-auth";
import { MAX_UPLOAD_BYTES, saveThumbnail } from "@/lib/server/thumbs";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"]);

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const linkId = String(form?.get("linkId") ?? "");
  if (!(file instanceof File) || !/^[a-z0-9-]{1,80}$/.test(linkId)) {
    return Response.json({ error: "File atau ID tautan tidak valid." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) return Response.json({ error: "Format harus PNG, JPG, WebP, AVIF, atau GIF." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Ukuran maksimal 8 MB." }, { status: 400 });

  try {
    return Response.json(await saveThumbnail(linkId, Buffer.from(await file.arrayBuffer())));
  } catch {
    return Response.json({ error: "Gambar tidak bisa diproses." }, { status: 400 });
  }
}
