// Screenshot halaman untuk thumbnail (hanya untuk API admin di mode dev).
// Memakai Google Chrome yang terpasang di komputer lewat playwright-core (tanpa unduh browser).
import "server-only";
import { chromium, type Browser } from "playwright-core";

const g = globalThis as typeof globalThis & { __portalShotBrowser?: Promise<Browser>; __portalShotTimer?: NodeJS.Timeout };

function getBrowser() {
  g.__portalShotBrowser ??= chromium.launch({ channel: "chrome", headless: true }).catch((e) => {
    g.__portalShotBrowser = undefined;
    throw new Error(`Google Chrome tidak bisa dijalankan (${e.message.split("\n")[0]}). Pastikan Chrome terpasang.`);
  });
  // Tutup browser bila 2 menit tidak dipakai.
  clearTimeout(g.__portalShotTimer);
  g.__portalShotTimer = setTimeout(async () => {
    const b = g.__portalShotBrowser;
    g.__portalShotBrowser = undefined;
    (await b?.catch(() => null))?.close();
  }, 120_000);
  return g.__portalShotBrowser;
}

export async function captureScreenshot(url: string): Promise<Buffer> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "id-ID",
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (res && res.status() >= 400) throw new Error(`Halaman merespons HTTP ${res.status()}`);
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
    // Beri waktu preloader/animasi masuk selesai.
    await page.waitForTimeout(1500);
    return await page.screenshot({ type: "png" });
  } catch (e) {
    const msg = (e as Error).message.split("\n")[0];
    throw new Error(/net::|Timeout/.test(msg) ? `Situs tidak bisa dibuka dari komputer ini (${msg.replace(/^.*?(net::\w+|Timeout \d+ms exceeded).*$/, "$1")})` : msg);
  } finally {
    await ctx.close();
  }
}
