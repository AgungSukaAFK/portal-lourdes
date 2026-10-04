"use client";

import { ArrowUpRight, HardHat } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hero, links } from "@/data/links";
import { formatDate, relativeDay, safetySource, useLatestSafety, useSafetyCompany } from "@/lib/safety";
import { useMounted } from "@/lib/use-mounted";
import { SafetyCompanySwitch } from "../safety-company-switch";
import { HeroSearch } from "./hero-search";
import { HeroSlideshow } from "./hero-slideshow";

function greeting(h: number) {
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

const longDate = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function Hero() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative z-20 mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6" aria-labelledby="hero-title">
      <div className="relative isolate rounded-[28px] shadow-pop">
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-[28px] bg-[#0b2a45]">
          <HeroSlideshow />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(6_22_40/0.94)_0%,rgb(8_34_60/0.82)_45%,rgb(8_34_60/0.35)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_100%,rgb(30_122_70/0.35),transparent)]" />
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-10 lg:p-10">
          <div className="min-w-0">
            <p className="animate-fade-up text-sm font-medium text-white/70" style={{ "--i": 0 } as React.CSSProperties}>
              {now ? (
                <>
                  {greeting(now.getHours())} · <span className="text-white/90">{longDate.format(now)}</span>
                </>
              ) : (
                "Selamat datang"
              )}
            </p>
            <h1
              id="hero-title"
              className="animate-fade-up mt-2 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px] lg:leading-[1.1]"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {hero.title}{" "}
              {hero.highlight && (
                <span className="bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">{hero.highlight}</span>
              )}
            </h1>
            <p
              className="animate-fade-up mt-3 max-w-xl text-pretty text-[15px] text-white/75 sm:text-base"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {hero.subtitle.replace("{jumlah}", String(links.length))}
            </p>
            <div className="animate-fade-up relative z-20 mt-6" style={{ "--i": 3 } as React.CSSProperties}>
              <HeroSearch />
            </div>
          </div>

          <SafetyToday />
        </div>
      </div>
    </section>
  );
}

function SafetyToday() {
  const company = useSafetyCompany();
  const { posts, live, available } = useLatestSafety(4, company);
  const src = safetySource(company);
  const mounted = useMounted();
  const [first, ...rest] = posts;

  return (
    <aside
      className="animate-fade-up rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-xl"
      style={{ "--i": 4 } as React.CSSProperties}
      aria-labelledby="safety-today"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="safety-today" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald-400/20 text-emerald-300">
            <HardHat className="size-4" />
          </span>
          Safety Topic
          {available && (
            <span className="ml-1 flex items-center gap-1.5 text-[11px] font-normal text-white/60" title={live ? `Data live dari ${src.name}` : "Data snapshot"}>
              <span className={`size-1.5 rounded-full ${live ? "animate-pulse-dot bg-emerald-400" : "bg-white/40"}`} />
              {live ? "Live" : "Memuat…"}
            </span>
          )}
        </h2>
        <SafetyCompanySwitch variant="glass" />
      </div>

      {!available ? (
        <div key={company} className="animate-fade-in mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Segera hadir</p>
          <p className="mt-1 text-lg font-bold leading-snug">Safety topic {company.toUpperCase()} belum tersedia</p>
          <p className="mt-1.5 text-[13px] text-white/70">
            Materi safety talk &amp; absensi toolbox khusus {src.name} sedang disiapkan. Absensi toolbox GIS hanya untuk karyawan GIS.
          </p>
          <Link href="/safety-topic/" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-300 hover:text-emerald-200">
            Lihat halaman safety topic →
          </Link>
        </div>
      ) : first ? (
        <div key={company} className="animate-fade-in">
          <a href={first.link} target="_blank" rel="noopener noreferrer" className="group mt-4 block">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              {company.toUpperCase()} · {mounted ? relativeDay(first.date) : formatDate(first.date)}
            </p>
            <p className="mt-1 text-lg font-bold leading-snug group-hover:underline">{first.title}</p>
            <p className="mt-1.5 line-clamp-2 text-[13px] text-white/70 lg:line-clamp-3">{first.excerpt}</p>
          </a>
          <ul className="mt-4 hidden space-y-1 border-t border-white/10 pt-3 sm:block">
            {rest.map((p) => (
              <li key={p.id}>
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-lg py-1.5 text-[13px]">
                  <span className="w-16 shrink-0 text-[11px] text-white/50">{formatDate(p.date).replace(/ \d{4}$/, "")}</span>
                  <span className="truncate text-white/85 group-hover:text-white">{p.title}</span>
                  <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-white/40 transition group-hover:text-white" />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/safety-topic/" className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-300 hover:text-emerald-200">
              Arsip &amp; cari →
            </Link>
            {src.absensiUrl && (
              <a
                href={src.absensiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-white/75 hover:text-white"
              >
                Absensi toolbox {company.toUpperCase()} <ArrowUpRight className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-24 rounded bg-white/15" />
          <div className="h-5 w-4/5 rounded bg-white/15" />
          <div className="h-4 w-full rounded bg-white/10" />
        </div>
      )}
    </aside>
  );
}
