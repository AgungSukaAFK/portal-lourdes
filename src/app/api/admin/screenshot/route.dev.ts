import { guard } from "@/lib/server/admin-auth";
import { captureScreenshot } from "@/lib/server/screenshot";
import { saveThumbnail } from "@/lib/server/thumbs";

export const maxDuration = 60;

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const { linkId, url } = (await req.json().catch(() => ({}))) as { linkId?: string; url?: string };
  if (!linkId || !/^[a-z0-9-]{1,80}$/.test(linkId) || !url || !/^https?:\/\//.test(url)) {
    return Response.json({ error: "ID atau URL tautan tidak valid." }, { status: 400 });
  }
  try {
    return Response.json(await saveThumbnail(linkId, await captureScreenshot(url)));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
