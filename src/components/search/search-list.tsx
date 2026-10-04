"use client";

import { ArrowRight, ArrowUpRight, Building2, HardHat, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { companyById } from "@/data/companies";
import { matchRanges } from "@/lib/search";
import { relativeDay } from "@/lib/safety";
import { recordQuery, recordVisit } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "../category-icon";
import type { SearchGroup, SearchItem } from "./use-search-items";

export function Highlight({ text, ranges }: { text: string; ranges: ReadonlyArray<readonly [number, number]> }) {
  if (!ranges.length) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  [...ranges]
    .sort((a, b) => a[0] - b[0])
    .forEach(([a, b], i) => {
      if (a < last) return;
      if (a > last) parts.push(text.slice(last, a));
      parts.push(<mark key={i}>{text.slice(a, b + 1)}</mark>);
      last = b + 1;
    });
  parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Saat item dipilih: catat riwayat, lalu biarkan <a> yang membuka tautan. */
export function onItemSelected(item: SearchItem, query: string) {
  if (item.linkId) recordVisit(item.linkId);
  if (query) recordQuery(query);
  if (item.kind === "all") {
    window.dispatchEvent(new CustomEvent("portal:directory-query", { detail: query }));
  }
}

/** Navigasi keyboard ↑ ↓ Enter untuk daftar hasil. */
export function useListKeyboard(items: SearchItem[], idPrefix: string) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [items]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => {
          const n = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
          document.getElementById(`${idPrefix}-${items[n].key}`)?.scrollIntoView({ block: "nearest" });
          return n;
        });
      } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        document.getElementById(`${idPrefix}-${items[active]?.key}`)?.click();
      }
    },
    [items, active, idPrefix],
  );

  return { active, setActive, onKeyDown, activeId: items[active] ? `${idPrefix}-${items[active].key}` : undefined };
}

export function SearchList({
  groups,
  query,
  active,
  setActive,
  idPrefix,
  listId,
  safetyLoading,
  onSelect,
}: {
  groups: SearchGroup[];
  query: string;
  active: number;
  setActive: (i: number) => void;
  idPrefix: string;
  listId: string;
  safetyLoading?: boolean;
  onSelect?: () => void;
}) {
  let index = -1;
  return (
    <div id={listId} role="listbox" aria-label="Hasil pencarian" className="flex flex-col gap-1">
      {groups.map((g, gi) => (
        <div key={g.label || gi} role="group" aria-label={g.label || undefined}>
          {g.label && (
            <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-faint">{g.label}</div>
          )}
          {g.items.map((item) => {
            index++;
            const i = index;
            return (
              <ResultRow
                key={item.key}
                id={`${idPrefix}-${item.key}`}
                item={item}
                active={i === active}
                onHover={() => setActive(i)}
                onSelect={() => {
                  onItemSelected(item, query);
                  onSelect?.();
                }}
              />
            );
          })}
        </div>
      ))}
      {safetyLoading && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-faint">
          <Loader2 className="size-3.5 animate-spin" /> Mencari di Safety Topic…
        </div>
      )}
    </div>
  );
}

function ResultRow({
  id,
  item,
  active,
  onHover,
  onSelect,
}: {
  id: string;
  item: SearchItem;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const co = item.company ? companyById[item.company] : null;
  return (
    <a
      id={id}
      role="option"
      aria-selected={active}
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      data-company={item.company}
      onMouseMove={onHover}
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors",
        active ? "bg-surface-2" : "hover:bg-surface-2/60",
        item.kind === "all" && "mt-1 border-t border-line pt-3 text-brand",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          item.kind === "all" ? "bg-brand-soft text-brand" : "bg-co-soft text-co",
        )}
      >
        {item.kind === "link" && item.category && <CategoryIcon id={item.category} className="size-[18px]" />}
        {item.kind === "company" && <Building2 className="size-[18px]" />}
        {item.kind === "safety" && <HardHat className="size-[18px]" />}
        {item.kind === "all" && <Search className="size-[18px]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">
          <Highlight text={item.title} ranges={matchRanges(item.hit, "title")} />
        </span>
        {item.subtitle && <span className="block truncate text-xs text-muted">{item.subtitle}</span>}
      </span>
      {co && item.kind !== "company" && (
        <span className="hidden shrink-0 rounded-md bg-co-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-co sm:inline">
          {item.date ? relativeDay(item.date) : co.shortName}
        </span>
      )}
      {item.external ? (
        <ArrowUpRight className={cn("size-4 shrink-0 text-faint transition", active && "text-fg")} />
      ) : (
        <ArrowRight className={cn("size-4 shrink-0 text-faint transition", active && "translate-x-0.5 text-fg")} />
      )}
    </a>
  );
}
