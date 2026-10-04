import { Search } from "lucide-react";
import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

export default function NotFound() {
  return (
    <PortalShell>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <p className="animate-float text-7xl font-black tracking-tighter text-brand">404</p>
        <h1 className="mt-4 text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-muted">Tautan mungkin sudah berubah. Coba cari lewat portal.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white dark:text-slate-900">
            Ke portal
          </Link>
          <Link href="/#direktori" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold">
            <Search className="size-4" /> Direktori
          </Link>
        </div>
      </div>
    </PortalShell>
  );
}
