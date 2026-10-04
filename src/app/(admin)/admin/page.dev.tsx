// Halaman admin — file `.dev.tsx` hanya dikenali saat `next dev` (lihat next.config.ts),
// sehingga /admin tidak ada sama sekali di build produksi.
import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/admin-app";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminApp />;
}
