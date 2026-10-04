// Layout admin: tanpa header/footer portal, dan tidak mengimpor content.json
// (agar Fast Refresh tidak me-reload admin saat konten disimpan).
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Kembali ke portal">
            <Logo name="lourdes-logo" alt="Lourdes Auto Parts" height={32} />
          </Link>
          <span className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-2 py-1 text-xs font-bold text-brand">
            <LayoutDashboard className="size-3.5" /> Admin
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
