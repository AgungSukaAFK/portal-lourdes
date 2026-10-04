"use client";

import { ArrowUpRight, ClipboardCheck, Clock, HardHat, Loader2, Search, WifiOff, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SafetyCard } from "@/components/home/safety-section";
import { SafetyCompanySwitch } from "@/components/safety-company-switch";
import { notify } from "@/components/toast";
import { chooseSafetyCompany, fetchSafety, isSafetyAvailable, safetySnapshot, safetySource, useSafetyCompany, type SafetyCompany, type SafetyPost } from "@/lib/safety";
import { setStoredChoice, useStoredChoice } from "@/lib/storage";
import { cn } from "@/lib/utils";

const PER_PAGE = 18;
const PERIODS = [
  { id: "all", label: "Semua", days: 0 },
  { id: "7", label: "7 hari", days: 7 },
  { id: "30", label: "30 hari", days: 30 },
  { id: "90", label: "3 bulan", days: 90 },
  { id: "365", label: "1 tahun", days: 365 },
] as const;
const PERIOD_IDS = PERIODS.map((p) => p.id);
const PERIOD_KEY = "portal:safety-period";
const SUGGESTIONS = ["APD", "listrik", "kebakaran", "pertolongan pertama", "kelelahan", "golden rules", "lingkungan"];

type PeriodId = (typeof PERIODS)[number]["id"];

/** Filter lokal untuk snapshot (dipakai saat API tidak bisa diakses). */
function filterSnapshot(company: SafetyCompany, q: string, days: number) {
  const nq = q.toLowerCase();
  const since = days ? Date.now() - days * 86_400_000 : 0;
  return safetySnapshot(company).posts.filter(
    (p) => (!nq || `${p.title} ${p.excerpt}`.toLowerCase().includes(nq)) && (!since || new Date(p.date).getTime() >= since),
  );
}

export function SafetyArchive() {
  // Perusahaan & periode diingat di perangkat ini.
  const company = useSafetyCompany();
  const period = useStoredChoice<PeriodId>(PERIOD_KEY, PERIOD_IDS, "all");
  const src = safetySource(company);
  const available = isSafetyAvailable(company);

  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<SafetyPost[]>(safetySnapshot(company).posts.slice(0, PER_PAGE));
  const [total, setTotal] = useState<number | null>(safetySnapshot(company).total);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(available);
  const [offline, setOffline] = useState(false);

  const days = PERIODS.find((p) => p.id === period)!.days;
  const after = useMemo(() => (days ? new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 19) : ""), [days]);

  // Debounce ketikan
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  // Halaman pertama setiap kali perusahaan / kata kunci / periode berubah
  useEffect(() => {
    setPage(1);
    setOffline(false);
    if (!available) {
      setPosts([]);
      setTotal(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetchSafety({ company, search: q, perPage: PER_PAGE, page: 1, signal: ctrl.signal, after })
      .then(({ posts, total }) => {
        setPosts(posts);
        setTotal(total);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        const local = filterSnapshot(company, q, days);
        setPosts(local);
        setTotal(local.length);
        setOffline(true);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [company, available, q, after, days]);

  const loadMore = () => {
    const next = page + 1;
    setLoading(true);
    fetchSafety({ company, search: q, perPage: PER_PAGE, page: next, after })
      .then(({ posts: more }) => {
        setPosts((p) => [...p, ...more]);
        setPage(next);
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  };

  const hasMore = available && !offline && total != null && posts.length < total;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12" data-company={company}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-co-soft px-3 py-1 text-xs font-bold text-co">
            <HardHat className="size-3.5" /> {src.name}
          </p>
          <h1 className="animate-fade-up mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ "--i": 1 } as React.CSSProperties}>
            Safety Topic
          </h1>
          <p className="animate-fade-up mt-2 max-w-2xl text-muted" style={{ "--i": 2 } as React.CSSProperties}>
            Materi safety talk harian untuk toolbox meeting. Pilih perusahaan Anda; pilihan & filter diingat di perangkat ini.
          </p>
        </div>
        <div className="animate-fade-up flex flex-wrap items-center gap-2" style={{ "--i": 3 } as React.CSSProperties}>
          <SafetyCompanySwitch className="p-1 [&>button]:px-3.5 [&>button]:py-2 [&>button]:text-sm" />
          {src.absensiUrl ? (
            <a
              href={src.absensiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-co px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 dark:text-slate-900"
            >
              <ClipboardCheck className="size-4" /> Absensi toolbox {company.toUpperCase()} <ArrowUpRight className="size-4" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() =>
                notify(`Absensi toolbox ${company.toUpperCase()} belum tersedia`, {
                  body: "Absensi toolbox GIS hanya untuk karyawan GIS.",
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-2.5 text-sm font-bold text-muted"
            >
              <Clock className="size-4" /> Absensi {company.toUpperCase()} segera hadir
            </button>
          )}
        </div>
      </div>

      {!available ? (
        <div key={company} className="animate-fade-up mt-8 rounded-3xl border border-dashed border-line-strong bg-surface/60 px-6 py-16 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-co-soft text-co">
            <HardHat className="size-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold">Dukungan safety topic {company.toUpperCase()} belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Materi safety talk dan absensi toolbox khusus {src.name} sedang disiapkan. Absensi toolbox GIS hanya untuk karyawan GIS.
          </p>
          <button
            type="button"
            onClick={() => chooseSafetyCompany("gis")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold shadow-card transition hover:border-line-strong"
          >
            Lihat safety topic GIS sebagai referensi
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-4 shadow-card transition focus-within:border-co">
              <Search className="size-4 shrink-0 text-faint" aria-hidden />
              <span className="sr-only">Cari safety topic</span>
              <input
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Cari topik ${company.toUpperCase()}, misal “APD” atau “listrik”…`}
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
              />
              {loading ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-faint" />
              ) : (
                input && (
                  <button type="button" onClick={() => setInput("")} aria-label="Hapus" className="text-faint hover:text-fg">
                    <X className="size-4" />
                  </button>
                )
              )}
            </label>
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1 scrollbar-none" role="group" aria-label="Periode">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStoredChoice(PERIOD_KEY, p.id)}
                  aria-pressed={period === p.id}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-[13px]",
                    period === p.id ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted" aria-live="polite">
              {total != null && (
                <>
                  <b className="text-fg">{total.toLocaleString("id-ID")}</b> topik {company.toUpperCase()}
                </>
              )}
            </span>
            {!input &&
              SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:border-co hover:text-co"
                >
                  {s}
                </button>
              ))}
            {offline && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                <WifiOff className="size-3.5" /> Situs {company.toUpperCase()} tidak terjangkau — menampilkan data tersimpan
              </span>
            )}
          </div>

          <h2 className="sr-only">Daftar safety topic</h2>
          <div className={cn("mt-5 grid gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3", loading && page === 1 && "opacity-60")}>
            {posts.map((p, i) => (
              <SafetyCard key={p.id} post={p} index={i % PER_PAGE} company={company} />
            ))}
          </div>

          {!loading && posts.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-line-strong px-6 py-14 text-center text-muted">
              Tidak ada safety topic{q ? ` untuk “${q}”` : ""}
              {days ? " pada periode ini" : ""}.
            </div>
          )}

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold shadow-card transition hover:border-co hover:text-co disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />} Muat lebih banyak
                <span className="text-faint">
                  ({posts.length} dari {total?.toLocaleString("id-ID")})
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
