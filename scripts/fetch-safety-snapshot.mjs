// Mengambil Safety Topic terbaru dari tiap perusahaan (lihat src/data/safety-sources.json) saat build,
// sebagai cadangan. Di browser, portal tetap mengambil data live; snapshot dipakai untuk render awal / saat offline.
import { readFile, writeFile } from "node:fs/promises";

const OUT = "src/data/safety-snapshot.json";
const sources = JSON.parse(await readFile("src/data/safety-sources.json", "utf8"));

const decode = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

let previous = {};
try {
  previous = JSON.parse(await readFile(OUT, "utf8"));
} catch {}

const snapshot = {};
for (const src of sources) {
  if (!src.api) {
    snapshot[src.company] = null; // belum tersedia
    continue;
  }
  try {
    const url = `${src.api}?categories=${src.category}&per_page=30&_fields=id,date,link,title,excerpt`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const total = Number(res.headers.get("x-wp-total")) || null;
    const posts = (await res.json()).map((p) => ({
      id: p.id,
      date: p.date,
      link: p.link,
      title: decode(p.title.rendered),
      excerpt: decode(p.excerpt.rendered).replace(/\s*\[…\]$/, "…").slice(0, 220),
    }));
    snapshot[src.company] = { fetchedAt: new Date().toISOString(), total, posts };
    console.log(`✓ ${src.company.toUpperCase()}: ${posts.length} safety topic disimpan (total ${total ?? "?"})`);
  } catch (err) {
    // Build tidak boleh gagal hanya karena situs sumber sedang tidak bisa diakses.
    snapshot[src.company] = previous[src.company] ?? { fetchedAt: null, total: null, posts: [] };
    console.warn(`! ${src.company.toUpperCase()}: gagal mengambil safety topic (${err.message}); memakai snapshot lama.`);
  }
}
await writeFile(OUT, JSON.stringify(snapshot, null, 2) + "\n");
