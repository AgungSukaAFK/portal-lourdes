// Klien API admin (hanya dipakai di mode dev).
import type { PortalContent, Thumbnail } from "@/data/schema";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/${path}/`, { credentials: "same-origin", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Gagal (${res.status})`), { status: res.status, issues: data.issues });
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const adminApi = {
  session: () => call<{ authenticated: boolean }>("session"),
  login: (password: string) => call<{ ok: true }>("login", json("POST", { password })),
  logout: () => call<{ ok: true }>("logout", { method: "POST" }),
  getContent: () => call<PortalContent>("content"),
  saveContent: (content: PortalContent) => call<{ ok: true; savedAt: string }>("content", json("PUT", content)),
  screenshot: (linkId: string, url: string) => call<Thumbnail>("screenshot", json("POST", { linkId, url })),
  uploadThumbnail: (linkId: string, file: File) => {
    const form = new FormData();
    form.set("linkId", linkId);
    form.set("file", file);
    return call<Thumbnail>("thumbnail", { method: "POST", body: form });
  },
};

export type ApiError = Error & { status?: number; issues?: { path: string; message: string }[] };
