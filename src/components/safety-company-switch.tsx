"use client";

import { chooseSafetyCompany, isSafetyAvailable, safetySources, useSafetyCompany } from "@/lib/safety";
import { cn } from "@/lib/utils";

/**
 * Pemilih sumber safety topic (GIS / GMI). Pilihan diingat di perangkat.
 * `glass` untuk dipakai di atas latar gelap (kartu hero).
 */
export function SafetyCompanySwitch({ variant = "default", className }: { variant?: "default" | "glass"; className?: string }) {
  const company = useSafetyCompany();
  const glass = variant === "glass";

  return (
    <div
      role="radiogroup"
      aria-label="Safety topic perusahaan"
      className={cn("inline-flex shrink-0 rounded-xl p-0.5", glass ? "bg-white/10 ring-1 ring-white/15" : "bg-surface-2", className)}
    >
      {safetySources.map((s) => {
        const active = s.company === company;
        return (
          <button
            key={s.company}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => chooseSafetyCompany(s.company)}
            title={isSafetyAvailable(s.company) ? `Safety topic ${s.name}` : `Safety topic ${s.name} (belum tersedia)`}
            data-company={s.company}
            className={cn(
              "relative flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-xs font-bold tracking-wide transition",
              glass
                ? active
                  ? "bg-white text-slate-900 shadow"
                  : "text-white/70 hover:text-white"
                : active
                  ? "bg-surface text-co shadow-card"
                  : "text-muted hover:text-fg",
            )}
          >
            {s.company.toUpperCase()}
            {!isSafetyAvailable(s.company) && (
              <span
                className={cn("rounded px-1 text-[9px] font-semibold uppercase", glass ? (active ? "bg-slate-200 text-slate-600" : "bg-white/15") : "bg-surface-3 text-faint")}
              >
                segera
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
