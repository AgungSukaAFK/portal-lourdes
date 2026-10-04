"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "ok";
type Toast = { id: number; title: string; body?: string; tone: Tone };

/** Tampilkan notifikasi singkat dari mana saja di portal. */
export function notify(title: string, opts: { body?: string; tone?: Tone } = {}) {
  window.dispatchEvent(new CustomEvent("portal:toast", { detail: { title, body: opts.body, tone: opts.tone ?? "info" } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = { id: Date.now() + Math.random(), ...(e as CustomEvent<Omit<Toast, "id">>).detail };
      // Notifikasi yang sama tidak ditumpuk.
      setToasts((list) => [...list.filter((x) => x.title !== t.title), t].slice(-3));
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), 4500);
    };
    window.addEventListener("portal:toast", onToast);
    return () => window.removeEventListener("portal:toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-scale-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface/95 p-3.5 shadow-pop backdrop-blur-xl"
        >
          <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl", t.tone === "ok" ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand")}>
            {t.tone === "ok" ? <CheckCircle2 className="size-4" /> : <Info className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[13px] text-muted">{t.body}</p>}
          </div>
          <button
            type="button"
            onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-fg"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
