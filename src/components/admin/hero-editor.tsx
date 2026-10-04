"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useState } from "react";
import type { HeroContent, PortalContent } from "@/data/schema";
import { Button, Card, Field, Select, TextArea, TextInput } from "./ui";

type Props = { content: PortalContent; update: (fn: (c: PortalContent) => PortalContent) => void };

const MAX_POPULAR = 8;

export function HeroEditor({ content, update }: Props) {
  const hero = content.hero;
  const set = (patch: Partial<HeroContent>) => update((c) => ({ ...c, hero: { ...c.hero, ...patch } }));
  const [pick, setPick] = useState("");
  const byId = Object.fromEntries(content.links.map((l) => [l.id, l]));
  const available = content.links.filter((l) => !hero.popular.includes(l.id));

  const movePopular = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= hero.popular.length) return;
    const next = [...hero.popular];
    [next[i], next[j]] = [next[j], next[i]];
    set({ popular: next });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <Card className="space-y-4">
        <h2 className="font-bold">Teks hero</h2>
        <Field label="Judul">{(id) => <TextInput id={id} value={hero.title} onChange={(e) => set({ title: e.target.value })} />}</Field>
        <Field label="Sorotan judul" hint="Bagian judul bergradien, boleh dikosongkan">
          {(id) => <TextInput id={id} value={hero.highlight} onChange={(e) => set({ highlight: e.target.value })} />}
        </Field>
        <Field label="Subjudul" hint={<>Tulis <code className="rounded bg-surface-2 px-1">{"{jumlah}"}</code> untuk menampilkan jumlah tautan otomatis.</>}>
          {(id) => <TextArea id={id} value={hero.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />}
        </Field>

        <div>
          <span className="text-xs font-semibold text-muted">
            Tautan populer ({hero.popular.length}/{MAX_POPULAR})
          </span>
          <ul className="mt-1.5 space-y-1.5">
            {hero.popular.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-xl border border-line px-2 py-1.5">
                <div className="flex flex-col">
                  <button type="button" onClick={() => movePopular(i, -1)} disabled={i === 0} className="p-0.5 text-faint hover:text-fg disabled:opacity-30" aria-label="Naik">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => movePopular(i, 1)} disabled={i === hero.popular.length - 1} className="p-0.5 text-faint hover:text-fg disabled:opacity-30" aria-label="Turun">
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <span className="flex-1 truncate text-sm font-medium">{byId[id]?.title ?? <span className="text-red-500">{id} (tidak ada)</span>}</span>
                <Button variant="ghost" size="sm" onClick={() => set({ popular: hero.popular.filter((x) => x !== id) })} aria-label="Hapus">
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Pilih tautan populer">
              <option value="">Pilih tautan…</option>
              {available.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </Select>
            <Button
              variant="primary"
              disabled={!pick || hero.popular.length >= MAX_POPULAR}
              onClick={() => {
                set({ popular: [...hero.popular, pick] });
                setPick("");
              }}
            >
              <Plus className="size-4" /> Tambah
            </Button>
          </div>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">Pratinjau</p>
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(110deg,#06162a,#0b2a45_55%,#12462f)] p-7 text-white shadow-pop">
          <p className="text-sm text-white/70">Selamat pagi · Senin, 1 Januari</p>
          <h3 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">
            {hero.title}{" "}
            {hero.highlight && <span className="bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">{hero.highlight}</span>}
          </h3>
          <p className="mt-3 text-[15px] text-white/75">{hero.subtitle.replace("{jumlah}", String(content.links.length))}</p>
          <div className="mt-5 h-12 rounded-2xl bg-white/95" />
          <div className="mt-4 flex flex-wrap gap-2">
            {hero.popular.map((id) => (
              <span key={id} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
                {byId[id]?.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
