// Pemrosesan thumbnail tautan (hanya untuk API admin di mode dev).
import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { THUMB_WIDTHS } from "@/data/constants";

const SRC_DIR = path.join(process.cwd(), "assets/thumbs");
const OUT_DIR = path.join(process.cwd(), "public/img/thumbs");
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Simpan sumber (maks. 1600px) lalu buat versi 16:10 berukuran 400 & 800px + placeholder blur. */
export async function saveThumbnail(linkId: string, input: Buffer) {
  await Promise.all([mkdir(SRC_DIR, { recursive: true }), mkdir(OUT_DIR, { recursive: true })]);
  const normalized = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 92 })
    .toBuffer();
  const file = `${linkId}-${createHash("sha1").update(normalized).digest("hex").slice(0, 8)}`;
  await sharp(normalized).toFile(path.join(SRC_DIR, `${file}.webp`));
  await renderThumbnail(file);
  const blur = await sharp(normalized).resize(24, 15, { fit: "cover", position: "top" }).webp({ quality: 40 }).toBuffer();
  return { file, blur: `data:image/webp;base64,${blur.toString("base64")}` };
}

export async function renderThumbnail(file: string) {
  const src = path.join(SRC_DIR, `${file}.webp`);
  for (const w of THUMB_WIDTHS) {
    await sharp(src)
      .resize(w, Math.round((w * 10) / 16), { fit: "cover", position: "top" })
      .webp({ quality: 78 })
      .toFile(path.join(OUT_DIR, `${file}-${w}.webp`));
  }
}

/** Hapus file thumbnail yang sudah tidak dipakai tautan mana pun. */
export async function pruneThumbnails(used: Set<string>) {
  const sizes = THUMB_WIDTHS.join("|");
  const targets = [
    { dir: SRC_DIR, base: (f: string) => f.replace(/\.webp$/, "") },
    { dir: OUT_DIR, base: (f: string) => f.replace(new RegExp(`-(${sizes})\\.webp$`), "") },
  ];
  for (const { dir, base } of targets) {
    const files = await readdir(dir).catch(() => [] as string[]);
    for (const f of files) {
      if (f.endsWith(".webp") && !used.has(base(f))) await unlink(path.join(dir, f)).catch(() => {});
    }
  }
}
