"use client";

import { AlertTriangle, Building2, CheckCircle2, ExternalLink, Info, Layers, Link2, Loader2, LogOut, RotateCcw, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortalContent, PortalLink } from "@/data/schema";
import { cn } from "@/lib/utils";
import { adminApi, type ApiError } from "./admin-api";
import { CompanyEditor } from "./company-editor";
import { HeroEditor } from "./hero-editor";
import { LinksManager } from "./links-manager";
import { LoginForm } from "./login-form";
import { TaxonomyManager } from "./taxonomy-manager";
import { Button } from "./ui";

type Tab = "tautan" | "taksonomi" | "perusahaan" | "hero";
type Toast = { id: number; msg: string; tone: "ok" | "error" };

export function AdminApp() {
  const [status, setStatus] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [content, setContent] = useState<PortalContent | null>(null);
  const [saved, setSaved] = useState("");
  const [tab, setTab] = useState<Tab>("tautan");
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<{ path: string; message: string }[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const load = useCallback(async () => {
    try {
      const c = await adminApi.getContent();
      setContent(c);
      setSaved(JSON.stringify(c));
      setStatus("ready");
    } catch (e) {
      setStatus((e as ApiError).status === 401 ? "login" : "error");
    }
  }, []);

  useEffect(() => {
    adminApi
      .session()
      .then((s) => (s.authenticated ? load() : setStatus("login")))
      .catch(() => setStatus("error"));
  }, [load]);

  const dirty = useMemo(() => !!content && JSON.stringify(content) !== saved, [content, saved]);

  const save = useCallback(async () => {
    if (!content || saving) return;
    setSaving(true);
    setIssues([]);
    try {
      await adminApi.saveContent(content);
      setSaved(JSON.stringify(content));
      toast("Tersimpan ke src/data/content.json");
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) setStatus("login");
      setIssues(err.issues ?? []);
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }, [content, saving, toast]);

  // Ctrl/Cmd+S untuk menyimpan, dan peringatan sebelum meninggalkan halaman bila ada perubahan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty]);

  const update = useCallback((fn: (c: PortalContent) => PortalContent) => setContent((c) => (c ? fn(c) : c)), []);
  // Tautan yang dihapus juga dilepas dari daftar "Populer" di hero.
  const setLinks = useCallback(
    (fn: (l: PortalLink[]) => PortalLink[]) =>
      update((c) => {
        const links = fn(c.links);
        const ids = new Set(links.map((l) => l.id));
        return { ...c, links, hero: { ...c.hero, popular: c.hero.popular.filter((id) => ids.has(id)) } };
      }),
    [update],
  );

  const logout = async () => {
    if (dirty && !confirm("Ada perubahan yang belum disimpan. Tetap keluar?")) return;
    await adminApi.logout().catch(() => {});
    window.location.href = "/";
  };

  if (status === "loading") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-faint" />
      </div>
    );
  }
  if (status === "error") {
    return <p className="mx-auto max-w-md px-4 py-24 text-center text-muted">Admin tidak bisa dimuat. Pastikan membuka lewat http://localhost saat menjalankan npm run dev.</p>;
  }
  if (status === "login" || !content) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <div className="animate-scale-in rounded-3xl border border-line bg-surface p-6 shadow-pop">
          <LoginForm onSuccess={load} />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Link2; count?: number }[] = [
    { id: "tautan", label: "Tautan", icon: Link2, count: content.links.length },
    { id: "taksonomi", label: "Departemen & Kategori", icon: Layers },
    { id: "perusahaan", label: "Perusahaan", icon: Building2 },
    { id: "hero", label: "Hero", icon: Sparkles },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Mode localhost</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Admin Konten Portal</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank" className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg">
            <ExternalLink className="size-4" /> Lihat portal
          </Link>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="size-4" /> Keluar
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand/25 bg-brand-soft/60 px-4 py-3 text-[13px] text-fg">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <p>
          Perubahan disimpan ke <code className="rounded bg-surface px-1">src/data/content.json</code> dan thumbnail ke{" "}
          <code className="rounded bg-surface px-1">assets/thumbs/</code>. Untuk menerbitkan ke produksi, jalankan{" "}
          <code className="rounded bg-surface px-1">npm run build</code> lalu deploy folder <code className="rounded bg-surface px-1">out/</code>. Halaman admin tidak ikut ter-build.
        </p>
      </div>

      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-surface-2 p-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
            )}
          >
            <t.icon className="size-4" /> {t.label}
            {t.count != null && <span className="rounded-md bg-surface-3 px-1.5 text-[11px] text-muted">{t.count}</span>}
          </button>
        ))}
      </div>

      {issues.length > 0 && (
        <div role="alert" className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
            <AlertTriangle className="size-4" /> Belum tersimpan — perbaiki dulu:
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-6 text-[13px]">
            {issues.map((i, n) => (
              <li key={n}>
                <code className="text-xs">{i.path}</code>: {i.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6" role="tabpanel">
        {tab === "tautan" && <LinksManager content={content} setLinks={setLinks} toast={toast} />}
        {tab === "taksonomi" && <TaxonomyManager content={content} update={update} toast={toast} />}
        {tab === "perusahaan" && <CompanyEditor content={content} update={update} />}
        {tab === "hero" && <HeroEditor content={content} update={update} />}
      </div>

      {/* Bilah simpan melayang */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-xl items-center gap-3 rounded-2xl border border-line bg-surface/90 p-2.5 pl-4 shadow-pop backdrop-blur-xl transition-all duration-300",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-amber-500" />
        <span className="flex-1 text-sm font-medium">Ada perubahan yang belum disimpan</span>
        <Button variant="ghost" size="sm" onClick={() => setContent(JSON.parse(saved))}>
          <RotateCcw className="size-3.5" /> Batalkan
        </Button>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan
          <kbd className="hidden rounded bg-white/20 px-1 text-[10px] sm:inline">⌘S</kbd>
        </Button>
      </div>

      {/* Toast */}
      <div className="fixed right-4 top-20 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-scale-in flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-pop",
              t.tone === "ok" ? "border-line bg-surface" : "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
            )}
          >
            {t.tone === "ok" ? <CheckCircle2 className="size-4 text-accent" /> : <AlertTriangle className="size-4" />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
