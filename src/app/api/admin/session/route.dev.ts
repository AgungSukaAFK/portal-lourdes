import { guard, hasValidSession } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = guard(req, { requireSession: false });
  if (blocked) return blocked;
  return Response.json({ authenticated: hasValidSession(req) });
}
