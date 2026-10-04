// Memastikan content.json valid sebelum build (mis. bila diedit manual, bukan lewat /admin).
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
console.log(`✓ content.json valid (${result.data.links.length} tautan)`);
