// Mengoptimasi gambar dari assets/source ke public/img (static export tidak punya image optimizer).
// - Slide: beberapa lebar dalam AVIF + WebP, plus placeholder blur kecil.
// - Logo: ukuran retina + varian "dark" (bagian gelap dibalik jadi terang) untuk tema gelap.
import sharp from "sharp";
import { mkdir, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const SRC = "assets/source";
const OUT = "public/img";
const MANIFEST = "src/data/images.generated.json";

const SLIDES = ["slide", "slide2", "slide3", "slide4", "slide5", "slide6"];
const SLIDE_WIDTHS = [640, 1280, 1920];
const THUMB_WIDTHS = [400, 800]; // samakan dengan src/data/constants.ts

const LOGOS = {
  "lourdes-logo": [180, 360],
  "gmi-landscape": [300, 600],
  "gis-landscape": [300, 600],
  "gmi-logo": [64, 150],
  "gis-logo": [64, 128],
};

async function isFresh(src, out) {
  try {
    const [a, b] = await Promise.all([stat(src), stat(out)]);
    return b.mtimeMs >= a.mtimeMs;
  } catch {
    return false;
  }
}

/** Membalik lightness piksel gelap (hitam/navy/hijau tua) agar terbaca di latar gelap. */
async function darkVariant(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    // Area putih/abu terang (latar & halo) dibuat transparan secara halus.
    if (l > 0.8 && d < 0.12) {
      data[i + 3] = Math.round(data[i + 3] * Math.min(1, (1 - l) / 0.2));
      continue;
    }
    if (l >= 0.3) continue;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    const nl = 1 - l * 0.9;
    const c = (1 - Math.abs(2 * nl - 1)) * Math.min(s, 0.75);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = nl - c / 2;
    let [rr, gg, bb] = [0, 0, 0];
    if (h < 60) [rr, gg, bb] = [c, x, 0];
    else if (h < 120) [rr, gg, bb] = [x, c, 0];
    else if (h < 180) [rr, gg, bb] = [0, c, x];
    else if (h < 240) [rr, gg, bb] = [0, x, c];
    else if (h < 300) [rr, gg, bb] = [x, 0, c];
    else [rr, gg, bb] = [c, 0, x];
    data[i] = Math.round((rr + m) * 255);
    data[i + 1] = Math.round((gg + m) * 255);
    data[i + 2] = Math.round((bb + m) * 255);
  }
  return sharp(data, { raw: info });
}

async function main() {
  await mkdir(`${OUT}/slides`, { recursive: true });
  await mkdir(`${OUT}/logos`, { recursive: true });
  const manifest = { slides: [], logos: {} };

  for (const name of SLIDES) {
    const src = path.join(SRC, `${name}.webp`);
    const meta = await sharp(src).metadata();
    const blur = await sharp(src).resize(24).webp({ quality: 40 }).toBuffer();
    const widths = SLIDE_WIDTHS.filter((w) => w <= meta.width);
    for (const w of widths) {
      for (const fmt of ["avif", "webp"]) {
        const out = `${OUT}/slides/${name}-${w}.${fmt}`;
        if (await isFresh(src, out)) continue;
        const img = sharp(src).resize(w);
        await (fmt === "avif" ? img.avif({ quality: 50, effort: 6 }) : img.webp({ quality: 72 })).toFile(out);
      }
    }
    manifest.slides.push({
      name,
      width: meta.width,
      height: meta.height,
      widths,
      blur: `data:image/webp;base64,${blur.toString("base64")}`,
    });
  }

  for (const [name, widths] of Object.entries(LOGOS)) {
    const src = path.join(SRC, `${name}.webp`);
    const meta = await sharp(src).metadata();
    for (const w of widths) {
      const light = `${OUT}/logos/${name}-${w}.webp`;
      const dark = `${OUT}/logos/${name}-dark-${w}.webp`;
      if (!(await isFresh(src, light))) {
        await sharp(src).resize(w).webp({ quality: 90, alphaQuality: 90 }).toFile(light);
      }
      if (!(await isFresh(src, dark))) {
        const resized = await sharp(src).resize(w).png().toBuffer();
        await (await darkVariant(resized)).webp({ quality: 90, alphaQuality: 90 }).toFile(dark);
      }
    }
    manifest.logos[name] = { widths, ratio: +(meta.width / meta.height).toFixed(4) };
  }

  // Thumbnail tautan (diunggah lewat /admin): pastikan versi 400/800px tersedia.
  await mkdir(`${OUT}/thumbs`, { recursive: true });
  const thumbs = (await readdir("assets/thumbs").catch(() => [])).filter((f) => f.endsWith(".webp"));
  for (const f of thumbs) {
    const src = `assets/thumbs/${f}`;
    for (const w of THUMB_WIDTHS) {
      const out = `${OUT}/thumbs/${f.replace(/\.webp$/, "")}-${w}.webp`;
      if (await isFresh(src, out)) continue;
      await sharp(src).resize(w, Math.round((w * 10) / 16), { fit: "cover", position: "top" }).webp({ quality: 78 }).toFile(out);
    }
  }

  // Gambar Open Graph untuk pratinjau saat link dibagikan.
  await sharp(path.join(SRC, "slide3.webp"))
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile("public/og.jpg");

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✓ ${SLIDES.length} slide, ${Object.keys(LOGOS).length} logo & ${thumbs.length} thumbnail dioptimasi`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
