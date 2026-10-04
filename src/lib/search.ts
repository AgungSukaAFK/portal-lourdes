import Fuse, { type FuseResultMatch, type IFuseOptions } from "fuse.js";
import { companyById } from "@/data/companies";
import { categories, departments, links, type PortalLink } from "@/data/links";

const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));
const departmentLabel = Object.fromEntries(departments.map((d) => [d.id, d.label]));

/** Sinonim sederhana agar istilah sehari-hari karyawan tetap ketemu. */
const SYNONYMS: Record<string, string[]> = {
  absen: ["absensi", "presensi", "kehadiran"],
  hadir: ["absensi", "kehadiran"],
  lampu: ["lamp", "light", "led", "bulb"],
  lamp: ["lampu"],
  loker: ["lowongan", "karier", "career"],
  kerja: ["karier", "lowongan"],
  magang: ["internship"],
  safety: ["k3", "keselamatan"],
  k3: ["safety", "keselamatan", "hse"],
  kabel: ["cable"],
  saklar: ["switch"],
  sekring: ["fuse"],
  toko: ["shop", "belanja"],
  beli: ["shop", "toko"],
  login: ["masuk", "akun"],
  kontak: ["contact", "hubungi"],
  alamat: ["kontak", "lokasi"],
  survei: ["survey", "kuesioner"],
  it: ["helpdesk"],
  darurat: ["emergency"],
  api: ["apar", "kebakaran"],
};

export type SearchDoc = PortalLink & { companyName: string; categoryLabel: string; departmentNames: string[] };

export const searchDocs: SearchDoc[] = links.map((l) => ({
  ...l,
  companyName: `${companyById[l.company].name} ${companyById[l.company].shortName}`,
  categoryLabel: categoryLabel[l.category],
  departmentNames: l.departments.map((d) => departmentLabel[d]).filter(Boolean),
}));

const options: IFuseOptions<SearchDoc> = {
  keys: [
    { name: "title", weight: 3 },
    { name: "tags", weight: 2 },
    { name: "categoryLabel", weight: 1 },
    { name: "companyName", weight: 1 },
    { name: "departmentNames", weight: 0.7 },
    { name: "description", weight: 0.8 },
  ],
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  ignoreDiacritics: true,
  threshold: 0.3,
  minMatchCharLength: 2,
};

// Kata pendek (≤ 4 huruf) dicari hampir persis agar "apar" tidak ikut cocok ke "spare";
// kata panjang lebih toleran terhadap salah ketik.
/** Skor Fuse (0 = persis) di atas ini dianggap tidak relevan. */
const MAX_WORD_SCORE = 0.45;

let strict: Fuse<SearchDoc> | null = null;
let loose: Fuse<SearchDoc> | null = null;
const getFuse = (word: string) =>
  word.length <= 4
    ? (strict ??= new Fuse(searchDocs, { ...options, threshold: 0.12 }))
    : (loose ??= new Fuse(searchDocs, options));

export type SearchHit = { doc: SearchDoc; score: number; matches: readonly FuseResultMatch[] };

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Pencarian per kata (AND), tiap kata boleh cocok lewat sinonimnya (OR), dengan toleransi typo.
 * Mengembalikan peta id → hit, diurutkan dari skor terbaik.
 */
export function searchLinks(query: string): Map<string, SearchHit> {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const result = new Map<string, SearchHit>();
  if (!words.length) return result;

  let acc: Map<string, SearchHit> | null = null;

  for (const word of words) {
    const variants = [word, ...(SYNONYMS[word] ?? [])];
    const best = new Map<string, SearchHit>();
    for (const v of variants) {
      for (const r of getFuse(v).search(v)) {
        if ((r.score ?? 1) > MAX_WORD_SCORE) continue;
        // Sinonim diberi sedikit penalti supaya kata asli tetap diutamakan.
        const score = (r.score ?? 1) + (v === word ? 0 : 0.08);
        const prev = best.get(r.item.id);
        if (!prev || score < prev.score) {
          best.set(r.item.id, { doc: r.item, score, matches: v === word ? r.matches ?? [] : prev?.matches ?? [] });
        }
      }
    }
    if (!acc) {
      acc = best;
    } else {
      const next = new Map<string, SearchHit>();
      for (const [id, hit] of acc) {
        const other = best.get(id);
        if (other) next.set(id, { doc: hit.doc, score: hit.score + other.score, matches: [...hit.matches, ...other.matches] });
      }
      acc = next;
    }
  }

  const sorted = [...(acc ?? new Map()).values()].sort((a, b) => a.score - b.score);
  for (const hit of sorted) result.set(hit.doc.id, hit);
  return result;
}

/** Rentang karakter yang cocok pada field tertentu, untuk highlight. */
export function matchRanges(hit: SearchHit | undefined, key: string): ReadonlyArray<readonly [number, number]> {
  if (!hit) return [];
  return hit.matches
    .filter((m) => m.key === key)
    .flatMap((m) => m.indices)
    .filter(([a, b]) => b - a >= 1);
}
