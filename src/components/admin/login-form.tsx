"use client";

import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { adminApi, type ApiError } from "./admin-api";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminApi.login(password);
      onSuccess();
    } catch (err) {
      setError((err as ApiError).message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
          <LockKeyhole className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold">Masuk Admin</h2>
          <p className="text-[13px] text-muted">Kelola konten portal (hanya di localhost).</p>
        </div>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-muted">Password</span>
        <div className="mt-1.5 flex h-11 items-center rounded-xl border border-line bg-surface px-3 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-[var(--ring)]">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            required
            className="h-full w-full bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-faint hover:text-fg"
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>
      {error && (
        <p role="alert" className="animate-scale-in rounded-lg bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !password}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-60 dark:text-slate-900"
      >
        {loading && <Loader2 className="size-4 animate-spin" />} Masuk
      </button>
    </form>
  );
}
