import { contentSchema } from "@/data/schema";
import { guard } from "@/lib/server/admin-auth";
import { readContent, writeContent } from "@/lib/server/content-store";
import { pruneThumbnails } from "@/lib/server/thumbs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  return Response.json(await readContent());
}

export async function PUT(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const parsed = contentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      {
        error: "Data tidak valid.",
        issues: parsed.error.issues.slice(0, 20).map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 400 },
    );
  }

  await writeContent(parsed.data);
  await pruneThumbnails(new Set(parsed.data.links.flatMap((l) => (l.thumbnail ? [l.thumbnail.file] : []))));
  return Response.json({ ok: true, savedAt: new Date().toISOString() });
}
