"use client";

import { useCallback, useSyncExternalStore } from "react";

// Favorit & riwayat disimpan di localStorage (per perangkat). Semua akses dibungkus try/catch
// karena storage bisa diblokir (mode privat, kebijakan browser kantor).

const listeners = new Set<() => void>();
const cache = new Map<string, string[]>();
const EMPTY: string[] = [];

function read(key: string): string[] {
  if (cache.has(key)) return cache.get(key)!;
  let value: string[] = EMPTY;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) value = parsed.filter((x) => typeof x === "string");
  } catch {}
  cache.set(key, value);
  return value;
}

function write(key: string, value: string[]) {
  cache.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key) cache.delete(e.key);
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function useStoredList(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );
}

const FAV_KEY = "portal:favorites";
const RECENT_KEY = "portal:recent";
const QUERY_KEY = "portal:recent-queries";

export function useFavorites() {
  const favorites = useStoredList(FAV_KEY);
  const toggle = useCallback((id: string) => {
    const cur = read(FAV_KEY);
    write(FAV_KEY, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, []);
  return { favorites, toggle, isFavorite: (id: string) => favorites.includes(id) };
}

export function useRecent() {
  return useStoredList(RECENT_KEY);
}

export function recordVisit(id: string) {
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, 8));
}

export function clearRecent() {
  write(RECENT_KEY, []);
}

export function useRecentQueries() {
  return useStoredList(QUERY_KEY);
}

export function recordQuery(q: string) {
  const v = q.trim();
  if (v.length < 2) return;
  write(QUERY_KEY, [v, ...read(QUERY_KEY).filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 5));
}

// ——— Pilihan tunggal (mis. perusahaan & periode safety topic) yang diingat di perangkat ———

const choiceCache = new Map<string, string | null>();

function readChoice(key: string): string | null {
  if (choiceCache.has(key)) return choiceCache.get(key)!;
  let v: string | null = null;
  try {
    v = window.localStorage.getItem(key);
  } catch {}
  choiceCache.set(key, v);
  return v;
}

export function setStoredChoice(key: string, value: string) {
  choiceCache.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {}
  listeners.forEach((l) => l());
}

/** Nilai pilihan dari localStorage; kembali ke `fallback` bila kosong/tidak valid (dan saat render server). */
export function useStoredChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const sub = useCallback(
    (cb: () => void) => {
      // Perubahan dari tab lain: hapus cache dulu, baru beri tahu React.
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        choiceCache.delete(key);
        cb();
      };
      window.addEventListener("storage", onStorage);
      listeners.add(cb);
      return () => {
        window.removeEventListener("storage", onStorage);
        listeners.delete(cb);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(
    sub,
    () => readChoice(key),
    () => null,
  );
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}
