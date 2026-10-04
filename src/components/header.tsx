"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Kbd, openSearch } from "./search/command-palette";
import { ThemeToggle } from "./theme-toggle";

// Tombol admin hanya ada di `next dev`; di build produksi kondisi ini false sehingga modulnya tidak ikut ter-bundle.
const AdminEntry = process.env.NODE_ENV === "development" ? dynamic(() => import("./admin/admin-entry"), { ssr: false }) : null;

const nav = [
  { href: "/", label: "Portal" },
  { href: "/safety-topic/", label: "Safety Topic" },
  { href: "/perusahaan/", label: "Perusahaan" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-line bg-surface/80 shadow-[0_6px_24px_-16px_rgb(0_0_0/0.35)] backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="Portal Lourdes — beranda">
          <Logo name="lourdes-logo" alt="Lourdes Auto Parts" height={34} />
          <span className="hidden border-l border-line pl-2.5 text-[13px] font-semibold leading-tight text-muted lg:block">
            Portal
            <br />
            Karyawan
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {nav.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {n.label}
                {active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={openSearch}
            className="group flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-faint shadow-card transition hover:border-line-strong hover:text-muted sm:w-64"
            aria-label="Cari (Ctrl+K)"
          >
            <Search className="size-4 transition group-hover:text-brand" />
            <span className="hidden sm:inline">Cari apa saja…</span>
            <span className="ml-auto hidden items-center gap-0.5 sm:flex">
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          {AdminEntry && <AdminEntry />}
          <ThemeToggle />
        </div>
      </div>

      {/* Navigasi bawah layar kecil */}
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none md:hidden" aria-label="Navigasi utama (mobile)">
        {nav.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active ? "bg-fg text-bg" : "bg-surface-2 text-muted",
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
