// Autentikasi admin — HANYA dipakai oleh route `*.dev.ts` (tidak pernah ikut ke build produksi).
import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

export const SESSION_COOKIE = "portal_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam

// Secret sesi dibuat acak per proses `next dev`; restart server = semua sesi berakhir.
const g = globalThis as typeof globalThis & { __portalAdminSecret?: Buffer; __portalLoginAttempts?: Map<string, number[]> };
const secret = (g.__portalAdminSecret ??= randomBytes(32));
const attempts = (g.__portalLoginAttempts ??= new Map());

export async function verifyPassword(password: string): Promise<boolean> {
  const raw = await readFile(path.join(process.cwd(), "admin.config.json"), "utf8");
  const { passwordHash } = JSON.parse(raw) as { passwordHash: string };
  const [algo, N, r, p, saltB64, hashB64] = passwordHash.split("$");
  if (algo !== "scrypt") throw new Error("Format hash tidak dikenal");
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: +N,
    r: +r,
    p: +p,
    maxmem: 128 * +N * +r * 2,
  });
  return timingSafeEqual(actual, expected);
}

/** Maksimal 5 percobaan login gagal per menit per alamat. */
export function tooManyAttempts(key: string) {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter((t: number) => now - t < 60_000);
  attempts.set(key, list);
  return list.length >= 5;
}
export const recordFailedAttempt = (key: string) => attempts.set(key, [...(attempts.get(key) ?? []), Date.now()]);

const sign = (v: string) => createHmac("sha256", secret).update(v).digest("base64url");

export function createSessionToken() {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return { token: `${exp}.${sign(exp)}`, maxAge: SESSION_TTL_MS / 1000 };
}

function readCookie(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

export function hasValidSession(req: Request) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expected = Buffer.from(sign(exp));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) && Date.now() < Number(exp);
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const hostname = (host: string | null) => (host ?? "").replace(/:\d+$/, "");
const originHost = (origin: string) => {
  try {
    return new URL(origin).hostname;
  } catch {
    return "";
  }
};

/**
 * Penjaga semua API admin: hanya dari localhost, request yang mengubah data harus same-origin,
 * dan (kecuali login) wajib punya sesi valid. Mengembalikan Response error, atau null bila lolos.
 */
export function guard(req: Request, { requireSession = true } = {}): Response | null {
  if (!LOCAL_HOSTS.has(hostname(req.headers.get("host")))) {
    return Response.json({ error: "Admin hanya bisa diakses dari localhost." }, { status: 403 });
  }
  if (req.method !== "GET") {
    const origin = req.headers.get("origin");
    if (!origin || !LOCAL_HOSTS.has(originHost(origin))) {
      return Response.json({ error: "Origin tidak diizinkan." }, { status: 403 });
    }
  }
  if (requireSession && !hasValidSession(req)) {
    return Response.json({ error: "Sesi berakhir. Silakan login lagi." }, { status: 401 });
  }
  return null;
}
