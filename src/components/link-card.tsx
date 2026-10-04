"use client";

import { ArrowUpRight, Check, Copy, Lock, Star, UsersRound } from "lucide-react";
import { useState } from "react";
import { companyById } from "@/data/companies";
import { categories, departments, linkTypes, type PortalLink } from "@/data/links";
import { matchRanges, type SearchHit } from "@/lib/search";
import { recordVisit, useFavorites } from "@/lib/storage";
import { cn, displayUrl } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { Highlight } from "./search/search-list";
import { LinkThumb } from "./link-thumb";

const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));
const typeLabel = Object.fromEntries(linkTypes.map((t) => [t.id, t.label]));
const deptLabel = Object.fromEntries(departments.map((d) => [d.id, d.label]));

export type CardView = "grid" | "list";

export function LinkCard({
  link,
  hit,
  view = "grid",
  index = 0,
  vtName,
  compact,
}: {
  link: PortalLink;
  hit?: SearchHit;
  view?: CardView;
  index?: number;
  vtName?: boolean;
  compact?: boolean;
}) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(link.id);
  const [popKey, setPopKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const co = companyById[link.company];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const actions = (overlay = false) => (
    <div className={cn("relative z-10 flex items-center gap-0.5", overlay && "rounded-xl bg-surface/85 p-0.5 shadow-card backdrop-blur")}>
      <button
        type="button"
        onClick={copy}
        title="Salin tautan"
        aria-label={`Salin tautan ${link.title}`}
        className={cn(
          "grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg",
          overlay
            ? "sm:hidden sm:group-hover:grid sm:group-focus-within:grid"
            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        )}
      >
        {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-[15px]" />}
      </button>
      <button
        type="button"
        onClick={() => {
          toggle(link.id);
          setPopKey((k) => k + 1);
        }}
        aria-pressed={fav}
        title={fav ? "Hapus dari favorit" : "Sematkan ke favorit"}
        aria-label={fav ? `Hapus ${link.title} dari favorit` : `Sematkan ${link.title} ke favorit`}
        className={cn("grid size-8 place-items-center rounded-lg transition hover:bg-surface-2", fav ? "text-star" : "text-muted hover:text-fg")}
      >
        <Star key={popKey} className={cn("size-4", fav && "fill-current", popKey > 0 && "animate-pop")} />
      </button>
    </div>
  );

  const titleEl = (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => recordVisit(link.id)}
      className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand"
    >
      <Highlight text={link.title} ranges={matchRanges(hit, "title")} />
    </a>
  );

  const badges = (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
      <span className="rounded-md bg-co-soft px-1.5 py-0.5 font-bold uppercase tracking-wide text-co">{co.shortName}</span>
      <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-muted">{categoryLabel[link.category]}</span>
      {link.type !== "website" && link.type !== "halaman" && (
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-muted">{typeLabel[link.type]}</span>
      )}
      {link.internal && (
        <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-accent">
          <Lock className="size-3" /> Karyawan
        </span>
      )}
    </div>
  );

  const depts = link.departments.map((d) => deptLabel[d]).filter(Boolean);
  const deptLine = depts.length > 0 && (
    <p className="flex items-center gap-1.5 truncate text-[11px] text-faint" title={depts.join(", ")}>
      <UsersRound className="size-3 shrink-0" aria-hidden />
      <span className="truncate">
        {depts.slice(0, 2).join(" · ")}
        {depts.length > 2 && ` +${depts.length - 2}`}
      </span>
    </p>
  );

  if (compact) {
    return (
      <article
        data-company={link.company}
        className="link-card group relative flex min-w-[220px] items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card"
      >
        <LinkThumb link={link} className="h-10 w-16 shrink-0 rounded-lg" iconClass="size-5" sizes="64px" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{titleEl}</h3>
          <p className="truncate text-xs text-muted">
            {co.shortName} · {displayUrl(link.url).split("/")[0]}
          </p>
        </div>
        {actions()}
      </article>
    );
  }

  const vt = { "--i": Math.min(index, 12), viewTransitionName: vtName ? `card-${link.id}` : undefined } as React.CSSProperties;

  if (view === "list") {
    return (
      <article
        data-company={link.company}
        style={vt}
        className="link-card animate-fade-up group relative flex items-center gap-4 rounded-2xl border border-line bg-surface p-2.5 pr-3 shadow-card"
      >
        <LinkThumb link={link} className="h-14 w-22.5 shrink-0 rounded-xl" iconClass="size-6" sizes="90px" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold">{titleEl}</h3>
            <ArrowUpRight className="link-arrow size-4 shrink-0 text-faint" aria-hidden />
          </div>
          <p className="truncate text-[13px] text-muted">
            <Highlight text={link.description} ranges={matchRanges(hit, "description")} />
          </p>
          <div className="mt-0.5 hidden md:block">{deptLine}</div>
        </div>
        <div className="hidden shrink-0 lg:block">{badges}</div>
        {actions()}
      </article>
    );
  }

  return (
    <article
      data-company={link.company}
      style={vt}
      className="link-card animate-fade-up group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
    >
      <div className="relative overflow-hidden">
        <LinkThumb
          link={link}
          className="aspect-16/10 w-full transition-transform duration-500 group-hover:scale-[1.04]"
          iconClass="size-10"
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
          showDomain
        />
        <div className="absolute right-2 top-2">{actions(true)}</div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-[15px] font-semibold leading-snug">{titleEl}</h3>
          <ArrowUpRight className="link-arrow mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
        </div>
        <p className="mt-0.5 truncate text-xs text-faint">{displayUrl(link.url)}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted">
          <Highlight text={link.description} ranges={matchRanges(hit, "description")} />
        </p>
        <div className="mt-3 space-y-2">
          {badges}
          {deptLine}
        </div>
      </div>
    </article>
  );
}
