"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { hero, links } from "@/data/links";
import { recordVisit } from "@/lib/storage";
import { Kbd } from "../search/command-palette";
import { SearchList, useListKeyboard } from "../search/search-list";
import { useSearchItems } from "../search/use-search-items";

const popular = hero.popular.map((id) => links.find((l) => l.id === id)).filter((l) => !!l);

/** Kotak pencarian utama: ketik lalu Enter langsung membuka hasil teratas. */
export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const { groups, flat, safetyLoading } = useSearchItems(query, { includeSafety: open });
  const kb = useListKeyboard(flat, "hero");

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div>
      <div ref={wrap} className="relative">
        <div className="flex h-14 items-center gap-3 rounded-2xl bg-white/95 px-4 text-slate-900 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/40 backdrop-blur transition focus-within:ring-4 focus-within:ring-white/30 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-white/10 sm:h-16">
          <Search className="size-5 shrink-0 text-slate-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                return;
              }
              if (!open) setOpen(true);
              kb.onKeyDown(e);
            }}
            placeholder="Mau buka apa? Coba “absen”, “lampu LED”, “golden rules”…"
            aria-label="Cari website, formulir, atau halaman"
            role="combobox"
            aria-expanded={open && groups.length > 0}
            aria-controls="hero-list"
            aria-activedescendant={open ? kb.activeId : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            className="h-full w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-slate-400 sm:text-base"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="size-4" />
            </button>
          ) : (
            <span className="hidden shrink-0 text-xs text-slate-400 sm:flex sm:items-center sm:gap-1">
              tekan <Kbd>/</Kbd>
            </span>
          )}
        </div>

        {open && groups.length > 0 && (
          <div className="animate-scale-in absolute inset-x-0 top-full z-30 mt-2 max-h-[min(62vh,480px)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-2 text-fg shadow-pop">
            <SearchList
              groups={groups}
              query={query}
              active={kb.active}
              setActive={kb.setActive}
              idPrefix="hero"
              listId="hero-list"
              safetyLoading={safetyLoading}
              onSelect={() => setOpen(false)}
            />
          </div>
        )}
        {open && query && groups.length === 0 && !safetyLoading && (
          <div className="animate-scale-in absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted shadow-pop">
            Tidak ada hasil untuk “{query}”.
          </div>
        )}
      </div>

      {popular.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-white/60">Populer:</span>
          {popular.map((l, i) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordVisit(l.id)}
              style={{ "--i": i + 4 } as React.CSSProperties}
              className="animate-fade-up rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20"
            >
              {l.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
