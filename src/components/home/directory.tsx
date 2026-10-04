"use client";

import {
  ArrowDownAZ,
  Building2,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Layers,
  ListFilter,
  Lock,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UsersRound,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { companies, companyById, type CompanyId } from "@/data/companies";
import { categories, departments, linkTypes, links, type CategoryId, type LinkType, type PortalLink } from "@/data/links";
import { searchLinks } from "@/lib/search";
import { useFavorites } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "../category-icon";
import { LinkCard, type CardView } from "../link-card";
import { Logo } from "../logo";

type Sort = "kategori" | "relevan" | "az" | "perusahaan";

type Filters = {
  q: string;
  co: CompanyId[];
  cat: CategoryId[];
  dept: string[];
  type: LinkType[];
  internal: boolean;
  fav: boolean;
  sort: Sort;
  view: CardView;
};

/** Jumlah kartu per kategori sebelum dilipat (tampilan "Per kategori"). */
const GROUP_LIMIT = 6;

const DEFAULT: Filters = { q: "", co: [], cat: [], dept: [], type: [], internal: false, fav: false, sort: "kategori", view: "grid" };

/** Departemen pilihan karyawan diingat di perangkat ini. */
const DEPT_KEY = "portal:department";
const loadDept = (): string[] => {
  try {
    const v = JSON.parse(window.localStorage.getItem(DEPT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => departments.some((d) => d.id === x)) : [];
  } catch {
    return [];
  }
};
const saveDept = (v: string[]) => {
  try {
    window.localStorage.setItem(DEPT_KEY, JSON.stringify(v));
  } catch {}
};

const sortOptions: { id: Sort; label: string; icon: typeof Layers }[] = [
  { id: "kategori", label: "Per kategori", icon: Layers },
  { id: "relevan", label: "Relevansi", icon: Sparkles },
  { id: "az", label: "A – Z", icon: ArrowDownAZ },
  { id: "perusahaan", label: "Perusahaan", icon: Building2 },
];

const catOrder = Object.fromEntries(categories.map((c, i) => [c.id, i]));
const coOrder = Object.fromEntries(companies.map((c, i) => [c.id, i]));

// ——— Sinkronisasi filter ↔ URL agar hasil bisa dibagikan & bertahan saat refresh ———
function parseUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  const list = <T extends string>(k: string, allowed: readonly string[]) =>
    (p.get(k)?.split(",").filter((x) => allowed.includes(x)) ?? []) as T[];
  return {
    q: p.get("q") ?? "",
    co: list("co", companies.map((c) => c.id)),
    cat: list("kategori", categories.map((c) => c.id)),
    // Departemen tersimpan hanya dipakai saat portal dibuka tanpa filter (bukan dari link yang dibagikan).
    dept: p.has("departemen")
      ? list("departemen", departments.map((d) => d.id))
      : ["q", "co", "kategori", "jenis", "karyawan", "favorit"].some((k) => p.has(k))
        ? []
        : loadDept(),
    type: list("jenis", linkTypes.map((t) => t.id)),
    internal: p.get("karyawan") === "1",
    fav: p.get("favorit") === "1",
    sort: (sortOptions.some((s) => s.id === p.get("urut")) ? p.get("urut") : "kategori") as Sort,
    view: p.get("tampilan") === "list" ? "list" : "grid",
  };
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.co.length) p.set("co", f.co.join(","));
  if (f.cat.length) p.set("kategori", f.cat.join(","));
  if (f.dept.length) p.set("departemen", f.dept.join(","));
  if (f.type.length) p.set("jenis", f.type.join(","));
  if (f.internal) p.set("karyawan", "1");
  if (f.fav) p.set("favorit", "1");
  if (f.sort !== "kategori") p.set("urut", f.sort);
  if (f.view !== "grid") p.set("tampilan", f.view);
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", url);
}

/** Jalankan perubahan state di dalam View Transition (animasi susun ulang kartu) bila didukung. */
function withTransition(fn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return fn();
  doc.startViewTransition(() => flushSync(fn));
}

const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function Directory() {
  const [f, setF] = useState<Filters>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState<CategoryId[]>([]);
  const { favorites } = useFavorites();
  const sectionRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setF(parseUrl());
    setHydrated(true);
    const onQuery = (e: Event) => {
      const q = (e as CustomEvent<string>).detail ?? "";
      setF((s) => ({ ...s, q }));
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("portal:directory-query", onQuery);
    return () => window.removeEventListener("portal:directory-query", onQuery);
  }, []);

  useEffect(() => {
    if (hydrated) writeUrl(f);
  }, [f, hydrated]);

  useEffect(() => {
    if (hydrated) saveDept(f.dept);
  }, [f.dept, hydrated]);

  /** Perubahan filter (bukan ketikan) dianimasikan dengan View Transition. */
  const update = useCallback((patch: Partial<Filters>) => withTransition(() => setF((s) => ({ ...s, ...patch }))), []);

  const hits = useMemo(() => searchLinks(f.q), [f.q]);

  // Predikat tiap facet, supaya jumlah per opsi dihitung terhadap filter lain (faceted count).
  const matches = useCallback(
    (l: PortalLink, skip?: "co" | "cat" | "dept" | "type") =>
      (!f.q || hits.has(l.id)) &&
      (skip === "co" || !f.co.length || f.co.includes(l.company)) &&
      (skip === "cat" || !f.cat.length || f.cat.includes(l.category)) &&
      (skip === "dept" || !f.dept.length || l.departments.some((d) => f.dept.includes(d))) &&
      (skip === "type" || !f.type.length || f.type.includes(l.type)) &&
      (!f.internal || !!l.internal) &&
      (!f.fav || favorites.includes(l.id)),
    [f, hits, favorites],
  );

  const results = useMemo(() => {
    const list = links.filter((l) => matches(l));
    const sort = f.sort === "kategori" && f.q ? "relevan" : f.sort;
    const byTitle = (a: PortalLink, b: PortalLink) => a.title.localeCompare(b.title, "id");
    if (sort === "relevan" && f.q) list.sort((a, b) => hits.get(a.id)!.score - hits.get(b.id)!.score);
    else if (sort === "az") list.sort(byTitle);
    else if (sort === "perusahaan") list.sort((a, b) => coOrder[a.company] - coOrder[b.company] || byTitle(a, b));
    else list.sort((a, b) => catOrder[a.category] - catOrder[b.category] || Number(!!b.featured) - Number(!!a.featured));
    return { list, sort };
  }, [matches, f.sort, f.q, hits]);

  const counts = useMemo(() => {
    const c = {
      co: {} as Record<string, number>,
      cat: {} as Record<string, number>,
      dept: {} as Record<string, number>,
      type: {} as Record<string, number>,
    };
    for (const l of links) {
      if (matches(l, "co")) c.co[l.company] = (c.co[l.company] ?? 0) + 1;
      if (matches(l, "cat")) c.cat[l.category] = (c.cat[l.category] ?? 0) + 1;
      if (matches(l, "type")) c.type[l.type] = (c.type[l.type] ?? 0) + 1;
      if (matches(l, "dept")) for (const d of l.departments) c.dept[d] = (c.dept[d] ?? 0) + 1;
    }
    return c;
  }, [matches]);

  const allCoCount = useMemo(() => links.filter((l) => matches(l, "co")).length, [matches]);
  const allDeptCount = useMemo(() => links.filter((l) => matches(l, "dept")).length, [matches]);

  const activeChips = [
    ...f.co.map((id) => ({ key: `co-${id}`, label: companyById[id].shortName, clear: () => update({ co: f.co.filter((x) => x !== id) }) })),
    ...f.cat.map((id) => ({
      key: `cat-${id}`,
      label: categories.find((c) => c.id === id)!.label,
      clear: () => update({ cat: f.cat.filter((x) => x !== id) }),
    })),
    ...f.dept.map((id) => ({
      key: `dept-${id}`,
      label: departments.find((d) => d.id === id)?.label ?? id,
      clear: () => update({ dept: f.dept.filter((x) => x !== id) }),
    })),
    ...f.type.map((id) => ({
      key: `type-${id}`,
      label: linkTypes.find((t) => t.id === id)!.label,
      clear: () => update({ type: f.type.filter((x) => x !== id) }),
    })),
    ...(f.internal ? [{ key: "internal", label: "Khusus karyawan", clear: () => update({ internal: false }) }] : []),
    ...(f.fav ? [{ key: "fav", label: "Favorit saya", clear: () => update({ fav: false }) }] : []),
  ];
  const filterCount = activeChips.length;
  const resetAll = () => update({ ...DEFAULT, sort: f.sort, view: f.view });

  const panel = <FilterPanel f={f} counts={counts} update={update} favCount={favorites.length} />;

  return (
    <section ref={sectionRef} id="direktori" className="lazy-section mx-auto mt-12 max-w-7xl scroll-mt-20 px-4 sm:px-6" aria-labelledby="direktori-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="direktori-title" className="text-2xl font-extrabold tracking-tight">
            Direktori tautan
          </h2>
          <p className="mt-1 text-sm text-muted">Saring berdasarkan perusahaan, departemen, kategori, atau jenis halaman.</p>
        </div>
      </div>

      {/* Tab perusahaan */}
      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0" role="group" aria-label="Filter perusahaan">
        <CompanyTab active={!f.co.length} onClick={() => update({ co: [] })} count={allCoCount}>
          <Layers className="size-4" /> Semua
        </CompanyTab>
        {companies.map((c) => (
          <CompanyTab
            key={c.id}
            company={c.id}
            active={f.co.includes(c.id)}
            count={counts.co[c.id] ?? 0}
            onClick={() => update({ co: f.co.length === 1 && f.co[0] === c.id ? [] : [c.id] })}
          >
            {c.logo.mark ? (
              <Logo name={c.logo.mark} alt="" height={20} />
            ) : (
              <span className="grid size-5 place-items-center rounded bg-co text-[11px] font-black text-white dark:text-slate-900">L</span>
            )}
            {c.shortName}
          </CompanyTab>
        ))}
      </div>

      {/* Departemen */}
      <div className="-mx-4 mt-3 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0" role="group" aria-label="Filter departemen">
        <span className="mr-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted">
          <UsersRound className="size-3.5" /> Departemen
        </span>
        <DeptChip active={!f.dept.length} count={allDeptCount} onClick={() => update({ dept: [] })}>
          Semua
        </DeptChip>
        {departments.map((d) => (
          <DeptChip
            key={d.id}
            active={f.dept.includes(d.id)}
            count={counts.dept[d.id] ?? 0}
            onClick={() => update({ dept: f.dept.length === 1 && f.dept[0] === d.id ? [] : [d.id] })}
          >
            {d.label}
          </DeptChip>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label="Filter">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-1 scrollbar-none">{panel}</div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex h-11 min-w-0 flex-1 basis-60 items-center gap-2 rounded-xl border border-line bg-surface px-3 shadow-card transition focus-within:border-brand focus-within:ring-4 focus-within:ring-[var(--ring)]">
              <Search className="size-4 shrink-0 text-faint" aria-hidden />
              <span className="sr-only">Saring direktori</span>
              <input
                ref={searchRef}
                type="search"
                value={f.q}
                onChange={(e) => setF((s) => ({ ...s, q: e.target.value }))}
                placeholder="Saring tautan…"
                className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
              />
              {f.q && (
                <button
                  type="button"
                  onClick={() => {
                    setF((s) => ({ ...s, q: "" }));
                    searchRef.current?.focus();
                  }}
                  className="grid size-6 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-fg"
                  aria-label="Hapus kata kunci"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </label>

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium shadow-card lg:hidden"
            >
              <SlidersHorizontal className="size-4" /> Filter
              {filterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white dark:text-slate-900">
                  {filterCount}
                </span>
              )}
            </button>

            <div className="flex h-11 items-center gap-1 rounded-xl border border-line bg-surface px-1 shadow-card">
              <label className="relative flex items-center">
                <span className="sr-only">Urutkan</span>
                <ListFilter className="pointer-events-none absolute left-2 size-4 text-faint" aria-hidden />
                <select
                  value={f.sort === "kategori" && f.q ? "relevan" : f.sort}
                  onChange={(e) => update({ sort: e.target.value as Sort })}
                  className="h-9 cursor-pointer appearance-none rounded-lg bg-transparent pl-8 pr-2 text-sm font-medium outline-none hover:bg-surface-2"
                >
                  {sortOptions.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.id === "relevan" && !f.q}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="h-5 w-px bg-line" />
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ view: v })}
                  aria-pressed={f.view === v}
                  aria-label={v === "grid" ? "Tampilan grid" : "Tampilan daftar"}
                  className={cn(
                    "grid size-9 place-items-center rounded-lg transition",
                    f.view === v ? "bg-surface-3 text-fg" : "text-faint hover:text-fg",
                  )}
                >
                  {v === "grid" ? <LayoutGrid className="size-4" /> : <LayoutList className="size-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ringkasan & chip filter aktif */}
          <div className="mt-3 flex min-h-8 flex-wrap items-center gap-2 text-sm">
            <span className="text-muted" aria-live="polite">
              <b className="font-semibold text-fg">{results.list.length}</b> tautan
              {f.q && (
                <>
                  {" "}untuk “<span className="text-fg">{f.q}</span>”
                </>
              )}
            </span>
            {activeChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="animate-scale-in flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-2.5 pr-1.5 text-xs font-semibold text-brand transition hover:brightness-95"
              >
                {c.label} <X className="size-3" />
              </button>
            ))}
            {(filterCount > 0 || f.q) && (
              <button type="button" onClick={resetAll} className="flex items-center gap-1 text-xs font-medium text-faint hover:text-fg">
                <RotateCcw className="size-3" /> Reset
              </button>
            )}
          </div>

          {/* Hasil */}
          <div className="mt-3">
            {results.list.length === 0 ? (
              <EmptyState q={f.q} onReset={resetAll} />
            ) : results.sort === "kategori" ? (
              <div className="space-y-8">
                {categories
                  .map((cat) => ({ cat, items: results.list.filter((l) => l.category === cat.id) }))
                  .filter((g) => g.items.length)
                  .map(({ cat, items }) => {
                    const open = expanded.includes(cat.id) || f.cat.length === 1;
                    const hidden = open ? 0 : Math.max(0, items.length - GROUP_LIMIT);
                    return (
                    <div key={cat.id}>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ viewTransitionName: `cat-${cat.id}` }}>
                        <CategoryIcon id={cat.id} className="size-4 text-brand" />
                        {cat.label}
                        <span className="rounded-md bg-surface-2 px-1.5 text-xs font-semibold text-muted">{items.length}</span>
                        <span className="hidden text-xs font-normal text-faint sm:inline">— {cat.description}</span>
                      </h3>
                      <ResultGrid items={hidden ? items.slice(0, GROUP_LIMIT) : items} view={f.view} hits={hits} />
                      {(hidden > 0 || (expanded.includes(cat.id) && items.length > GROUP_LIMIT)) && (
                        <button
                          type="button"
                          onClick={() => withTransition(() => setExpanded((e) => toggleIn(e, cat.id)))}
                          aria-expanded={!hidden}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-2.5 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
                        >
                          {hidden ? `Tampilkan ${hidden} lainnya` : "Tampilkan lebih sedikit"}
                          <ChevronDown className={cn("size-4 transition-transform", !hidden && "rotate-180")} />
                        </button>
                      )}
                    </div>
                    );
                  })}
              </div>
            ) : (
              <ResultGrid items={results.list} view={f.view} hits={hits} />
            )}
          </div>
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} count={results.list.length} onReset={resetAll}>
        {panel}
      </FilterSheet>
    </section>
  );
}

function ResultGrid({ items, view, hits }: { items: PortalLink[]; view: CardView; hits: ReturnType<typeof searchLinks> }) {
  return (
    <div className={cn("grid gap-3", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
      {items.map((l, i) => (
        <LinkCard key={l.id} link={l} hit={hits.get(l.id)} view={view} index={i} vtName />
      ))}
    </div>
  );
}

function DeptChip({ active, count, onClick, children }: { active: boolean; count: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={!active && count === 0}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition active:scale-95 disabled:opacity-40",
        active ? "border-brand bg-brand text-white dark:text-slate-900" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
      <span className={cn("tabular-nums", active ? "opacity-80" : "text-faint")}>{count}</span>
    </button>
  );
}

function CompanyTab({
  active,
  company,
  count,
  onClick,
  children,
}: {
  active: boolean;
  company?: CompanyId;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-company={company}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition active:scale-[0.97]",
        active
          ? company
            ? "border-co bg-co-soft text-co shadow-card"
            : "border-fg bg-fg text-bg shadow-card"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
      <span className={cn("rounded-md px-1.5 text-[11px]", active ? "bg-black/10 dark:bg-white/15" : "bg-surface-2")}>{count}</span>
    </button>
  );
}

function FilterPanel({
  f,
  counts,
  update,
  favCount,
}: {
  f: Filters;
  counts: { co: Record<string, number>; cat: Record<string, number>; dept: Record<string, number>; type: Record<string, number> };
  update: (p: Partial<Filters>) => void;
  favCount: number;
}) {
  return (
    <div className="space-y-6">
      <FilterGroup title="Tampilkan">
        <Toggle checked={f.internal} onChange={(v) => update({ internal: v })} icon={<Lock className="size-3.5" />}>
          Khusus karyawan
        </Toggle>
        <Toggle checked={f.fav} onChange={(v) => update({ fav: v })} icon={<Star className="size-3.5" />} badge={favCount}>
          Favorit saya
        </Toggle>
      </FilterGroup>

      <FilterGroup title="Departemen">
        {departments.map((d) => (
          <Check key={d.id} checked={f.dept.includes(d.id)} onChange={() => update({ dept: toggleIn(f.dept, d.id) })} count={counts.dept[d.id] ?? 0}>
            {d.label}
          </Check>
        ))}
      </FilterGroup>

      <FilterGroup title="Kategori">
        {categories.map((c) => (
          <Check
            key={c.id}
            checked={f.cat.includes(c.id)}
            onChange={() => update({ cat: toggleIn(f.cat, c.id) })}
            count={counts.cat[c.id] ?? 0}
            icon={<CategoryIcon id={c.id} className="size-4" />}
          >
            {c.label}
          </Check>
        ))}
      </FilterGroup>

      <FilterGroup title="Jenis">
        {linkTypes.map((t) => (
          <Check key={t.id} checked={f.type.includes(t.id)} onChange={() => update({ type: toggleIn(f.type, t.id) })} count={counts.type[t.id] ?? 0}>
            {t.label}
          </Check>
        ))}
      </FilterGroup>

      <FilterGroup title="Perusahaan">
        {companies.map((c) => (
          <Check key={c.id} checked={f.co.includes(c.id)} onChange={() => update({ co: toggleIn(f.co, c.id) })} count={counts.co[c.id] ?? 0}>
            {c.legalName}
          </Check>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{title}</legend>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  );
}

function Check({
  checked,
  onChange,
  count,
  icon,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  count: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const disabled = !checked && count === 0;
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition",
        checked ? "bg-brand-soft font-semibold text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
        disabled && "cursor-default opacity-45 hover:bg-transparent",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" />
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded border transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand",
          checked ? "border-brand bg-brand" : "border-line-strong",
        )}
        aria-hidden
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-3 text-white dark:text-slate-900">
            <path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <span className="text-xs tabular-nums text-faint">{count}</span>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  icon,
  badge,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-surface-2 hover:text-fg">
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">
        {children}
        {!!badge && <span className="ml-1.5 text-xs text-faint">{badge}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" role="switch" />
      <span
        className="relative h-5 w-9 shrink-0 rounded-full bg-surface-3 transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
        aria-hidden
      />
    </label>
  );
}

function FilterSheet({
  open,
  onClose,
  count,
  onReset,
  children,
}: {
  open: boolean;
  onClose: () => void;
  count: number;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Filter direktori"
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-surface p-0 text-fg shadow-pop sm:mx-auto sm:mb-4 sm:max-w-lg sm:rounded-3xl lg:hidden"
    >
      {open && (
        <div className="animate-sheet-up flex max-h-[85dvh] flex-col">
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-surface-3" aria-hidden />
          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <h2 className="text-lg font-bold">Filter</h2>
            {/* autoFocus: fokus awal di atas agar sheet tidak ter-scroll saat dibuka */}
            <button type="button" onClick={onReset} autoFocus className="text-sm font-medium text-brand">
              Reset
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="h-12 w-full rounded-xl bg-brand text-sm font-bold text-white transition active:scale-[0.98] dark:text-slate-900"
            >
              Tampilkan {count} tautan
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

function EmptyState({ q, onReset }: { q: string; onReset: () => void }) {
  return (
    <div className="animate-fade-in rounded-3xl border border-dashed border-line-strong px-6 py-14 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface-2 text-faint">
        <Search className="size-6" />
      </div>
      <p className="mt-4 font-semibold">Tidak ada tautan yang cocok{q && <> dengan “{q}”</>}</p>
      <p className="mt-1 text-sm text-muted">Coba kata lain, kurangi filter, atau cari Safety Topic lewat ⌘K.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90"
      >
        <RotateCcw className="size-4" /> Reset pencarian & filter
      </button>
    </div>
  );
}
