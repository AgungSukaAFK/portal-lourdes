// Memastikan content.json valid sebelum build (mis. bila diedit manual, bukan lewat /admin).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { contentSchema } from "../src/data/schema";

const result = contentSchema.safeParse(JSON.parse(readFileSync("src/data/content.json", "utf8")));
if (!result.success) {
  console.error("✗ content.json tidak valid:");
  for (const i of result.error.issues) console.error(`  - ${i.path.join(".")}: ${i.message}`);
  process.exit(1);
}
const missing = result.data.links.filter((l) => l.thumbnail && !existsSync(`assets/thumbs/${l.thumbnail.file}.webp`));
if (missing.length) {
  console.error(`✗ File thumbnail hilang: ${missing.map((l) => l.thumbnail!.file).join(", ")}`);
  process.exit(1);
}
// Favorit & riwayat karyawan disimpan per ID tautan. Peringatkan bila ada ID yang hilang
// dibanding commit terakhir (tautan dihapus), agar tidak terjadi tanpa disadari.
try {
  const prev = JSON.parse(execFileSync("git", ["show", "HEAD:src/data/content.json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  const now = new Set(result.data.links.map((l) => l.id));
  const gone = (prev.links as { id: string }[]).map((l) => l.id).filter((id) => !now.has(id));
  if (gone.length) {
    console.warn(`! ${gone.length} tautan dihapus sejak commit terakhir: ${gone.join(", ")}`);
    console.warn("  Karyawan yang memfavoritkannya tidak akan melihatnya lagi. Pastikan ini disengaja.");
  }
} catch {} // Bukan repo git / belum ada commit.

console.log(`✓ content.json valid (${result.data.links.length} tautan)`);
