"use client";

import { useEffect, useState } from "react";
import snapshot from "@/data/safety-snapshot.json";
import sources from "@/data/safety-sources.json";
import { notify } from "@/components/toast";
import { setStoredChoice, useStoredChoice } from "./storage";

export type SafetyPost = { id: number; date: string; link: string; title: string; excerpt: string };

/** Sumber safety topic per perusahaan. `api: null` = belum tersedia (placeholder). */
export type SafetySource = {
  company: "gis" | "gmi";
  name: string;
  api: string | null;
  category: number | null;
  archiveUrl: string | null;
  absensiUrl: string | null;
};
export type SafetyCompany = SafetySource["company"];

export const safetySources = sources as SafetySource[];
export const SAFETY_COMPANIES = safetySources.map((s) => s.company);
export const safetySource = (c: SafetyCompany) => safetySources.find((s) => s.company === c)!;
export const isSafetyAvailable = (c: SafetyCompany) => !!safetySource(c).api;

type Snapshot = { fetchedAt: string | null; total: number | null; posts: SafetyPost[] } | null;
const snapshots = snapshot as Record<SafetyCompany, Snapshot>;
export const safetySnapshot = (c: SafetyCompany) => snapshots[c] ?? { fetchedAt: null, total: null, posts: [] };

// ——— Pilihan perusahaan (GIS/GMI) diingat di perangkat ———
const COMPANY_KEY = "portal:safety-company";

export const useSafetyCompany = () => useStoredChoice<SafetyCompany>(COMPANY_KEY, SAFETY_COMPANIES, "gis");

export function chooseSafetyCompany(c: SafetyCompany) {
  setStoredChoice(COMPANY_KEY, c);
  if (!isSafetyAvailable(c)) {
    notify(`Dukungan safety topic ${c.toUpperCase()} belum tersedia`, {
      body: `Materi safety talk & absensi toolbox khusus ${safetySource(c).name} sedang disiapkan.`,
    });
  }
}

const decode = (s: string) => {
  const el = document.createElement("textarea");
  el.innerHTML = s.replace(/<[^>]*>/g, "");
  return el.value.replace(/\s+/g, " ").trim();
};

const memo = new Map<string, { posts: SafetyPost[]; total: number }>();

export async function fetchSafety({
  company,
  search = "",
  page = 1,
  perPage = 12,
  after,
  signal,
}: {
  company: SafetyCompany;
  search?: string;
  page?: number;
  perPage?: number;
  /** ISO datetime; hanya post setelah tanggal ini. */
  after?: string;
  signal?: AbortSignal;
}) {
  const src = safetySource(company);
  if (!src.api) throw new Error(`Safety topic ${company.toUpperCase()} belum tersedia`);

  const params = new URLSearchParams({
    categories: String(src.category),
    per_page: String(perPage),
    page: String(page),
    _fields: "id,date,link,title,excerpt",
  });
  if (search) params.set("search", search);
  if (after) params.set("after", after);
  const key = `${company}?${params}`;
  const hit = memo.get(key);
  if (hit) return hit;

  const res = await fetch(`${src.api}?${params}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get("x-wp-total")) || 0;
  const raw: { id: number; date: string; link: string; title: { rendered: string }; excerpt: { rendered: string } }[] =
    await res.json();
  const posts = raw.map((p) => ({
    id: p.id,
    date: p.date,
    link: p.link,
    title: decode(p.title.rendered),
    excerpt: decode(p.excerpt.rendered).replace(/\s*\[…\]$/, "…").slice(0, 220),
  }));
  const value = { posts, total };
  memo.set(key, value);
  return value;
}

/** Safety topic terbaru: render awal dari snapshot build, lalu diperbarui dari API live. */
export function useLatestSafety(count: number, company: SafetyCompany) {
  const initial = () => ({
    company,
    posts: safetySnapshot(company).posts.slice(0, count),
    total: safetySnapshot(company).total,
    live: false,
  });
  const [state, setState] = useState(initial);
  // Ganti perusahaan → langsung tampilkan snapshot-nya (tanpa sisa data perusahaan lain).
  const current = state.company === company ? state : initial();

  useEffect(() => {
    if (!isSafetyAvailable(company)) return;
    const ctrl = new AbortController();
    fetchSafety({ company, perPage: count, signal: ctrl.signal })
      .then(({ posts, total }) => setState({ company, posts, total, live: true }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [count, company]);

  return { ...current, available: isSafetyAvailable(company) };
}

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));

export function relativeDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  );
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  if (diff < 7) return `${diff} hari lalu`;
  return formatDate(iso);
}
