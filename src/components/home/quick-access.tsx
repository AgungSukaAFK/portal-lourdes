"use client";

import { Clock, Link2, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { links } from "@/data/links";
import { clearRecent, favoritesBackupUrl, restoreFavoritesFromHash, useFavorites, useRecent } from "@/lib/storage";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { LinkCard } from "../link-card";
import { notify } from "../toast";

const byId = Object.fromEntries(links.map((l) => [l.id, l]));
const featured = links.filter((l) => l.featured);

type Tab = "favorit" | "terakhir" | "populer";

export function QuickAccess() {
  const mounted = useMounted();
  const { favorites } = useFavorites();
  const recent = useRecent();
  const [chosen, setChosen] = useState<Tab | null>(null);

  // Buka dari tautan cadangan (#favorit=…) → gabungkan ke favorit di perangkat ini.
  useEffect(() => {
    const added = restoreFavoritesFromHash();
    if (added) {
      setChosen("favorit");
      // Ditunda agar Toaster sudah memasang listener-nya.
      setTimeout(() => notify(`${added} favorit dipulihkan`, { tone: "ok", body: "Favorit dari tautan cadangan sudah ditambahkan." }));
    }
  }, []);

  async function copyBackup() {
    const url = favoritesBackupUrl();
    try {
      await navigator.clipboard.writeText(url);
      notify("Tautan cadangan favorit disalin", {
        tone: "ok",
        body: "Simpan tautan ini. Buka kembali bila favorit hilang (mis. alamat portal berubah atau ganti browser).",
      });
    } catch {
      window.prompt("Salin tautan cadangan favorit ini:", url);
    }
  }

  const favLinks = favorites.map((id) => byId[id]).filter(Boolean);
  const recentLinks = recent.map((id) => byId[id]).filter(Boolean);
  const tab: Tab = chosen ?? "favorit";

  const tabs: { id: Tab; label: string; icon: typeof Star; count?: number }[] = [
    { id: "favorit", label: "Favorit", icon: Star, count: favLinks.length },
    { id: "terakhir", label: "Terakhir dibuka", icon: Clock, count: recentLinks.length },
    { id: "populer", label: "Sering dipakai", icon: Sparkles },
  ];

  const items = tab === "favorit" ? favLinks : tab === "terakhir" ? recentLinks : featured;

  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6" aria-labelledby="akses-cepat">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="akses-cepat" className="text-lg font-bold tracking-tight">
          Akses cepat
        </h2>
        <div role="tablist" aria-label="Akses cepat" className="flex rounded-xl bg-surface-2 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setChosen(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:text-[13px]",
                tab === t.id ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
              )}
            >
              <t.icon className={cn("size-3.5", t.id === "favorit" && tab === t.id && "fill-star text-star")} />
              <span>{t.label}</span>
              {mounted && !!t.count && <span className="rounded bg-surface-3 px-1 text-[10px] text-muted">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="mt-4">
        {!mounted ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-[66px] min-w-[220px] flex-1 rounded-2xl" />
            ))}
          </div>
        ) : items.length ? (
          <div
            key={tab}
            className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4"
          >
            {items.slice(0, 8).map((l, i) => (
              <div key={l.id} className="animate-fade-up snap-start" style={{ "--i": i } as React.CSSProperties}>
                <LinkCard link={l} compact />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in rounded-2xl border border-dashed border-line-strong px-5 py-6 text-center text-sm text-muted">
            {tab === "favorit" ? (
              <>
                Belum ada favorit. Tekan <Star className="inline size-4 align-[-3px] text-star" /> di kartu mana pun untuk
                menyematkannya di sini.
                <button
                  type="button"
                  onClick={() => setChosen("populer")}
                  className="mt-3 block w-full text-[13px] font-semibold text-brand hover:underline sm:mx-auto sm:mt-2 sm:w-auto"
                >
                  Lihat yang sering dipakai →
                </button>
              </>
            ) : (
              "Tautan yang Anda buka dari portal akan muncul di sini."
            )}
          </div>
        )}
        {mounted && tab === "favorit" && favorites.length > 0 && (
          <button
            type="button"
            onClick={copyBackup}
            className="mt-2 inline-flex items-center gap-1 text-xs text-faint hover:text-muted"
          >
            <Link2 className="size-3.5" />
            Salin tautan cadangan favorit
          </button>
        )}
        {mounted && tab === "terakhir" && recentLinks.length > 0 && (
          <button type="button" onClick={clearRecent} className="mt-2 text-xs text-faint hover:text-muted">
            Hapus riwayat
          </button>
        )}
      </div>
    </section>
  );
}
