import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AmbientBackground } from "@/components/ambient-background";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  // Ganti lewat env saat deploy, mis. NEXT_PUBLIC_SITE_URL=https://portal.lourdesautoparts.com
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Portal Lourdes Group", template: "%s · Portal Lourdes" },
  description:
    "Akses cepat ke semua website Lourdes Auto Parts, PT Garuda Mart Indonesia, dan PT Global Inti Sejati — formulir karyawan, safety topic, katalog produk, dan kontak.",
  openGraph: { images: ["/og.jpg"], locale: "id_ID", type: "website", siteName: "Portal Lourdes Group" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f16" },
  ],
};

// Layout akar sengaja tidak mengimpor content.json, supaya halaman admin tidak ikut
// ter-reload setiap kali konten disimpan. Header/footer portal ada di (portal)/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          <AmbientBackground />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
