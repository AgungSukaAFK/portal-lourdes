import { createSessionToken, guard, recordFailedAttempt, SESSION_COOKIE, tooManyAttempts, verifyPassword } from "@/lib/server/admin-auth";

export async function POST(req: Request) {
  const blocked = guard(req, { requireSession: false });
  if (blocked) return blocked;

  const key = req.headers.get("x-forwarded-for") ?? "local";
  if (tooManyAttempts(key)) {
    return Response.json({ error: "Terlalu banyak percobaan. Tunggu 1 menit." }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const ok = typeof body.password === "string" && body.password.length <= 200 && (await verifyPassword(body.password));
  if (!ok) {
    recordFailedAttempt(key);
    return Response.json({ error: "Password salah." }, { status: 401 });
  }

  const { token, maxAge } = createSessionToken();
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`);
  return res;
}
