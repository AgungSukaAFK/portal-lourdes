"use client";

import { CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRecentQueries } from "@/lib/storage";
import { SearchList, useListKeyboard } from "./search-list";
import { useSearchItems } from "./use-search-items";

export const openSearch = () => window.dispatchEvent(new Event("portal:open-search"));

/** Command palette global (⌘K / Ctrl+K / "/"), memakai <dialog> native agar ringan & aksesibel. */
export function CommandPalette() {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { groups, flat, safetyLoading } = useSearchItems(open ? query : "", { includeSafety: open });
  const kb = useListKeyboard(flat, "cmd");
  const recentQueries = useRecentQueries();

  useEffect(() => {
    const show = () => {
      setQuery("");
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("portal:open-search", show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("portal:open-search", show);
    };
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === ref.current && setOpen(false)}
      aria-label="Cari di portal"
      className="m-0 mx-auto mt-[8vh] w-[calc(100%-1.5rem)] max-w-xl overflow-visible bg-transparent p-0 text-fg backdrop:bg-transparent sm:mt-[12vh]"
    >
      {open && (
        <div className="animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-5 shrink-0 text-faint" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={kb.onKeyDown}
              placeholder="Cari website, formulir, produk, safety topic…"
              role="combobox"
              aria-expanded="true"
              aria-controls="cmd-list"
              aria-activedescendant={kb.activeId}
              autoComplete="off"
              spellCheck={false}
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-faint"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-fg"
              aria-label="Tutup"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[min(60vh,520px)] overflow-y-auto overscroll-contain p-2">
            {!query && recentQueries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2 pb-1 pt-2">
                {recentQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuery(q)}
                    className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:border-brand hover:text-brand"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {groups.length > 0 ? (
              <SearchList
                groups={groups}
                query={query}
                active={kb.active}
                setActive={kb.setActive}
                idPrefix="cmd"
                listId="cmd-list"
                safetyLoading={safetyLoading}
                onSelect={() => setOpen(false)}
              />
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted">
                {safetyLoading ? "Mencari…" : <>Tidak ada hasil untuk “{query}”. Coba kata lain, misalnya “absen” atau “lampu”.</>}
              </div>
            )}
          </div>

          <div className="hidden items-center gap-4 border-t border-line bg-surface-2/50 px-4 py-2 text-[11px] text-faint sm:flex">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> pilih
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="size-3" />
              </Kbd>{" "}
              buka
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd> tutup
            </span>
          </div>
        </div>
      )}
    </dialog>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-line bg-surface px-1 font-sans text-[10px] font-medium text-muted">
      {children}
    </kbd>
  );
}
