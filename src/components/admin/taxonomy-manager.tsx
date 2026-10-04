"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ICON_NAMES, type IconName } from "@/data/constants";
import type { Category, Department, PortalContent } from "@/data/schema";
import { cn } from "@/lib/utils";
import { NamedIcon } from "../named-icon";
import { Button, Card, TextInput, uniqueId } from "./ui";

type Props = {
  content: PortalContent;
  update: (fn: (c: PortalContent) => PortalContent) => void;
  toast: (msg: string, tone?: "ok" | "error") => void;
};

const move = <T,>(arr: T[], i: number, d: -1 | 1) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export function TaxonomyManager({ content, update, toast }: Props) {
  const deptUsage = (id: string) => content.links.filter((l) => l.departments.includes(id)).length;
  const catUsage = (id: string) => content.links.filter((l) => l.category === id).length;

  // ——— Departemen ———
  const setDepts = (fn: (d: Department[]) => Department[]) => update((c) => ({ ...c, departments: fn(c.departments) }));
  const addDept = (label: string) => {
    const id = uniqueId(label, content.departments.map((d) => d.id));
    setDepts((ds) => [...ds, { id, label }]);
    toast(`Departemen "${label}" ditambahkan`);
  };
  const removeDept = (d: Department) => {
    const n = deptUsage(d.id);
    if (n && !confirm(`Departemen "${d.label}" dipakai ${n} tautan. Hapus dan lepaskan dari tautan-tautan tersebut?`)) return;
    update((c) => ({
      ...c,
      departments: c.departments.filter((x) => x.id !== d.id),
      links: c.links.map((l) => ({ ...l, departments: l.departments.filter((x) => x !== d.id) })),
    }));
  };

  // ——— Kategori ———
  const setCats = (fn: (c: Category[]) => Category[]) => update((c) => ({ ...c, categories: fn(c.categories) }));
  const addCat = (label: string) => {
    const id = uniqueId(label, content.categories.map((c) => c.id));
    setCats((cs) => [...cs, { id, label, description: label, icon: "globe" }]);
    toast(`Kategori "${label}" ditambahkan`);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <h2 className="font-bold">Departemen</h2>
        <p className="mt-1 text-[13px] text-muted">Dipakai sebagai tag & filter “Departemen” di portal. Urutan di sini = urutan chip filter.</p>
        <ul className="mt-4 space-y-2">
          {content.departments.map((d, i) => (
            <li key={d.id} className="flex items-center gap-2">
              <Reorder onUp={() => setDepts((ds) => move(ds, i, -1))} onDown={() => setDepts((ds) => move(ds, i, 1))} first={i === 0} last={i === content.departments.length - 1} />
              <TextInput
                value={d.label}
                onChange={(e) => setDepts((ds) => ds.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)))}
                aria-label={`Nama departemen ${d.label}`}
                className="flex-1"
              />
              <span className="w-16 shrink-0 text-right text-xs text-faint">{deptUsage(d.id)} tautan</span>
              <Button variant="danger" size="sm" onClick={() => removeDept(d)} aria-label={`Hapus ${d.label}`}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        <AddRow placeholder="Nama departemen baru, mis. Quality Control" onAdd={addDept} />
      </Card>

      <Card>
        <h2 className="font-bold">Kategori</h2>
        <p className="mt-1 text-[13px] text-muted">Mengelompokkan tautan di direktori. Kategori yang masih dipakai tidak bisa dihapus.</p>
        <ul className="mt-4 space-y-3">
          {content.categories.map((c, i) => {
            const used = catUsage(c.id);
            return (
              <li key={c.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <Reorder onUp={() => setCats((cs) => move(cs, i, -1))} onDown={() => setCats((cs) => move(cs, i, 1))} first={i === 0} last={i === content.categories.length - 1} />
                  <IconPicker value={c.icon} onChange={(icon) => setCats((cs) => cs.map((x) => (x.id === c.id ? { ...x, icon } : x)))} />
                  <TextInput
                    value={c.label}
                    onChange={(e) => setCats((cs) => cs.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))}
                    aria-label="Nama kategori"
                    className="flex-1 font-semibold"
                  />
                  <span className="w-16 shrink-0 text-right text-xs text-faint">{used} tautan</span>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={used > 0}
                    title={used ? `Pindahkan ${used} tautan ke kategori lain dulu` : "Hapus kategori"}
                    onClick={() => setCats((cs) => cs.filter((x) => x.id !== c.id))}
                    aria-label={`Hapus ${c.label}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <TextInput
                  value={c.description}
                  onChange={(e) => setCats((cs) => cs.map((x) => (x.id === c.id ? { ...x, description: e.target.value } : x)))}
                  aria-label="Deskripsi kategori"
                  placeholder="Deskripsi singkat"
                  className="mt-2 h-9 text-[13px]"
                />
              </li>
            );
          })}
        </ul>
        <AddRow placeholder="Nama kategori baru" onAdd={addCat} />
      </Card>
    </div>
  );
}

function Reorder({ onUp, onDown, first, last }: { onUp: () => void; onDown: () => void; first: boolean; last: boolean }) {
  return (
    <div className="flex shrink-0 flex-col">
      <button type="button" onClick={onUp} disabled={first} className="rounded p-0.5 text-faint hover:text-fg disabled:opacity-30" aria-label="Pindah ke atas">
        <ArrowUp className="size-3.5" />
      </button>
      <button type="button" onClick={onDown} disabled={last} className="rounded p-0.5 text-faint hover:text-fg disabled:opacity-30" aria-label="Pindah ke bawah">
        <ArrowDown className="size-3.5" />
      </button>
    </div>
  );
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (label: string) => void }) {
  const [v, setV] = useState("");
  const submit = () => {
    if (!v.trim()) return;
    onAdd(v.trim());
    setV("");
  };
  return (
    <div className="mt-4 flex gap-2">
      <TextInput value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())} placeholder={placeholder} />
      <Button variant="primary" onClick={submit} disabled={!v.trim()}>
        <Plus className="size-4" /> Tambah
      </Button>
    </div>
  );
}

function IconPicker({ value, onChange }: { value: IconName; onChange: (v: IconName) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Pilih ikon"
        className="grid size-10 place-items-center rounded-xl border border-line bg-brand-soft text-brand transition hover:border-brand"
      >
        <NamedIcon name={value} className="size-5" />
      </button>
      {open && (
        <div className="animate-scale-in absolute left-0 top-full z-20 mt-2 grid w-64 grid-cols-5 gap-1 rounded-2xl border border-line bg-surface p-2 shadow-pop">
          {ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              title={name}
              className={cn("grid size-10 place-items-center rounded-lg transition hover:bg-surface-2", name === value && "bg-brand-soft text-brand")}
            >
              <NamedIcon name={name} className="size-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
