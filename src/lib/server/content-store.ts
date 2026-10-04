// Membaca & menulis src/data/content.json (hanya untuk API admin di mode dev).
import "server-only";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { contentSchema, type PortalContent } from "@/data/schema";

const FILE = path.join(process.cwd(), "src/data/content.json");

export async function readContent(): Promise<PortalContent> {
  return contentSchema.parse(JSON.parse(await readFile(FILE, "utf8")));
}

/** Tulis atomik (file sementara lalu rename) agar content.json tidak pernah setengah tertulis. */
export async function writeContent(content: PortalContent) {
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(content, null, 2) + "\n");
  await rename(tmp, FILE);
}
