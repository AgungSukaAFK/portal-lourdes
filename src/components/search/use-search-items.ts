"use client";

import { useEffect, useMemo, useState } from "react";
import { companies, type CompanyId } from "@/data/companies";
import { links, type CategoryId } from "@/data/links";
import { fetchSafety, safetySources, type SafetyPost } from "@/lib/safety";
import { normalize, searchLinks, type SearchHit } from "@/lib/search";
import { useFavorites, useRecent } from "@/lib/storage";

export type SearchItem = {
  key: string;
  kind: "link" | "company" | "safety" | "all";
  title: string;
  subtitle?: string;
  href: string;
  external: boolean;
  linkId?: string;
  company?: CompanyId;
  category?: CategoryId;
  hit?: SearchHit;
  date?: string;
};

export type SearchGroup = { label: string; items: SearchItem[] };

const linkById = Object.fromEntries(links.map((l) => [l.id, l]));

const toItem = (id: string, hit?: SearchHit): SearchItem | null => {
  const l = linkById[id];
  if (!l) return null;
  return {
    key: `link-${l.id}`,
    kind: "link",
    title: l.title,
    subtitle: l.description,
    href: l.url,
    external: true,
    linkId: l.id,
    company: l.company,
    category: l.category,
    hit,
  };
};

/** Sumber safety topic yang sudah tersedia (saat ini hanya GIS) ikut dicari secara live. */
const searchableSafety = safetySources.find((s) => s.api);

/** Hasil pencarian terkelompok: tautan, perusahaan, dan safety topic (live). */
export function useSearchItems(query: string, { includeSafety = true } = {}) {
  const q = query.trim();
  const { favorites } = useFavorites();
  const recent = useRecent();

  const hits = useMemo(() => searchLinks(q), [q]);

  const [safety, setSafety] = useState<{ q: string; posts: SafetyPost[]; loading: boolean }>({
    q: "",
    posts: [],
    loading: false,
  });

  useEffect(() => {
    if (!includeSafety || !searchableSafety || q.length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setSafety((s) => ({ ...s, q, loading: true }));
      fetchSafety({ company: searchableSafety.company, search: q, perPage: 4, signal: ctrl.signal })
        .then(({ posts }) => setSafety({ q, posts, loading: false }))
        .catch((e) => {
          if (e.name !== "AbortError") setSafety({ q, posts: [], loading: false });
        });
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, includeSafety]);

  const groups = useMemo<SearchGroup[]>(() => {
    if (!q) {
      const seen = new Set<string>();
      const take = (ids: string[], n: number) =>
        ids
          .filter((id) => !seen.has(id) && linkById[id] && seen.add(id))
          .slice(0, n)
          .map((id) => toItem(id)!);
      return [
        { label: "Terakhir dibuka", items: take(recent, 4) },
        { label: "Favorit", items: take(favorites, 5) },
        { label: "Paling sering dipakai", items: take(links.filter((l) => l.featured).map((l) => l.id), 6) },
      ].filter((g) => g.items.length);
    }

    const out: SearchGroup[] = [];
    const linkItems = [...hits.values()].slice(0, 7).map((h) => toItem(h.doc.id, h)!);
    if (linkItems.length) out.push({ label: "Tautan", items: linkItems });

    const nq = normalize(q);
    const cos = companies
      .filter((c) => [c.name, c.shortName, c.legalName].some((n) => normalize(n).includes(nq)))
      .map<SearchItem>((c) => ({
        key: `co-${c.id}`,
        kind: "company",
        title: c.legalName,
        subtitle: `Profil, kontak & semua tautan ${c.shortName}`,
        href: `/perusahaan/${c.id}/`,
        external: false,
        company: c.id,
      }));
    if (cos.length) out.push({ label: "Perusahaan", items: cos });

    if (includeSafety && q.length >= 3 && safety.q === q && safety.posts.length) {
      out.push({
        label: `Safety Topic ${searchableSafety?.company.toUpperCase()}`,
        items: safety.posts.map((p) => ({
          key: `safety-${p.id}`,
          kind: "safety",
          title: p.title,
          subtitle: p.excerpt,
          href: p.link,
          external: true,
          company: searchableSafety?.company,
          date: p.date,
        })),
      });
    }

    if (hits.size > 0) {
      out.push({
        label: "",
        items: [
          {
            key: "all",
            kind: "all",
            title: `Lihat semua ${hits.size} hasil di direktori`,
            href: `/?q=${encodeURIComponent(q)}#direktori`,
            external: false,
          },
        ],
      });
    }
    return out;
  }, [q, hits, recent, favorites, safety, includeSafety]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const safetyLoading = includeSafety && q.length >= 3 && (safety.q !== q || safety.loading);

  return { groups, flat, total: hits.size, safetyLoading };
}
