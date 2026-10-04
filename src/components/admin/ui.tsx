"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Buat id unik dari teks, menambahkan -2, -3, … bila sudah dipakai. */
export function uniqueId(base: string, taken: Iterable<string>) {
  const set = new Set(taken);
  const root = slugify(base) || "item";
  let id = root;
  for (let i = 2; set.has(id); i++) id = `${root}-${i}`;
  return id;
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: (id: string) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <div className="mt-1.5">{children(id)}</div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-faint">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  "rounded-xl border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted";

export function TextInput({ invalid, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...props} className={cn(inputBase, "h-10 w-full", invalid && "border-red-500", className)} />;
}

export function TextArea({ invalid, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...props} className={cn(inputBase, "min-h-20 w-full py-2 leading-relaxed", invalid && "border-red-500", className)} />;
}

/** Lebar default penuh; berikan `className` berisi kelas lebar (mis. `w-auto`) untuk menimpanya. */
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "h-10 cursor-pointer pr-8", /\bw-/.test(className ?? "") ? className : cn("w-full", className))} />;
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 transition hover:bg-surface-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" role="switch" />
      <span
        aria-hidden
        className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-surface-3 transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** Input chip: Enter atau koma untuk menambah, Backspace di input kosong untuk menghapus. */
export function TagsInput({ id, value, onChange, placeholder }: { id?: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const items = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !value.includes(t));
    if (items.length) onChange([...value, ...items]);
    setDraft("");
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-[var(--ring)]">
      {value.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-lg bg-surface-2 py-0.5 pl-2 pr-1 text-xs font-medium">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded p-0.5 text-faint hover:text-fg" aria-label={`Hapus ${t}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-faint"
      />
    </div>
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm",
        variant === "primary" && "bg-brand text-white shadow-card hover:bg-brand-hover dark:text-slate-900",
        variant === "secondary" && "border border-line bg-surface text-fg shadow-card hover:border-line-strong",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-fg",
        variant === "danger" && "text-red-600 hover:bg-red-500/10 dark:text-red-400",
        className,
      )}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-2xl border border-line bg-surface p-5 shadow-card", className)} />;
}
