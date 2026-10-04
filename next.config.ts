import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Produksi: situs statis murni. Dev: server biasa agar API admin bisa menulis konten.
    output: isDev ? undefined : "export",
    // File `*.dev.tsx` / `*.dev.ts` (halaman & API admin) hanya dikenali saat `next dev`,
    // sehingga sama sekali tidak ikut ter-build ke produksi.
    pageExtensions: isDev ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"],
    trailingSlash: true,
    images: { unoptimized: true },
    poweredByHeader: false,
  };
}
