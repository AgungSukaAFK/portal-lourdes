import { guard, SESSION_COOKIE } from "@/lib/server/admin-auth";

export async function POST(req: Request) {
  const blocked = guard(req, { requireSession: false });
  if (blocked) return blocked;
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  return res;
}
