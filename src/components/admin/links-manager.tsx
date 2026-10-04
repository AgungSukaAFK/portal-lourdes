"use client";

import { Camera, Copy, ImageOff, ImagePlus, Loader2, Lock, Pencil, Plus, Search, Square, Star, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMPANY_IDS, LINK_TYPES, THUMB_WIDTHS } from "@/data/constants";
import { linkSchema, type Category, type PortalContent, type PortalLink } from "@/data/schema";
import { cn, displayUrl } from "@/lib/utils";
import { NamedIcon } from "../named-icon";
import { adminApi, type ApiError } from "./admin-api";
import { Button, Field, Select, Switch, TagsInput, TextArea, TextInput, uniqueId } from "./ui";

type Props = {
  content: PortalContent;
  setLinks: (fn: (links: PortalLink[]) => PortalLink[]) => void;
  toast: (msg: string, tone?: "ok" | "error") => void;
};

export function AdminThumb({ link, categories, className }: { link: PortalLink; categories: Category[]; className?: string }) {
  if (link.thumbnail) {
    return (
      <img
        src={`/img/thumbs/${link.thumbnail.file}-${THUMB_WIDTHS[0]}.webp`}
        alt=""
        className={cn("bg-surface-2 object-cover object-top", className)}
        style={{ backgroundImage: `url(${link.thumbnail.blur})`, backgroundSize: "cover" }}
      />
    );
  }
  const icon = categories.find((c) => c.id === link.category)?.icon ?? "globe";
  return (
    <div data-company={link.company} className={cn("grid place-items-center bg-co-soft text-co", className)}>
      <NamedIcon name={icon} className="size-1/3 max-h-8 max-w-8" />
    </div>
  );
}

export function LinksManager({ content, setLinks, toast }: Props) {
  const [q, setQ] = useState("");
  const [co, setCo] = useState("");
  const [cat, setCat] = useState("");
  const [dept, setDept] = useState("");
  const [noThumb, setNoThumb] = useState(false);
  const [editing, setEditing] = useState<{ link: PortalLink; isNew: boolean } | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number; current: string; failed: string[] } | null>(null);
  const stopRef = useRef(false);

  const companyName = Object.fromEntries(content.companies.map((c) => [c.id, c.shortName]));
  const catLabel = Object.fromEntries(content.categories.map((c) => [c.id, c.label]));

  const list = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return content.links.filter(
      (l) =>
        (!nq || `${l.title} ${l.url} ${l.description} ${l.tags.join(" ")}`.toLowerCase().includes(nq)) &&
        (!co || l.company === co) &&
        (!cat || l.category === cat) &&
        (!dept || l.departments.includes(dept)) &&
        (!noThumb || !l.thumbnail),
    );
  }, [content.links, q, co, cat, dept, noThumb]);

  const withThumb = content.links.filter((l) => l.thumbnail).length;

  /** Ambil screenshot berurutan untuk tautan (yang tampil) yang belum punya thumbnail. */
  const runBulk = async () => {
    const targets = list.filter((l) => !l.thumbnail);
    if (!targets.length) return toast("Semua tautan yang tampil sudah punya thumbnail");
    stopRef.current = false;
    const failed: string[] = [];
    for (let i = 0; i < targets.length && !stopRef.current; i++) {
      const l = targets[i];
      setBulk({ done: i, total: targets.length, current: l.title, failed });
      try {
        const thumb = await adminApi.screenshot(l.id, l.url);
        setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, thumbnail: thumb } : x)));
      } catch {
        failed.push(l.title);
      }
    }
    setBulk(null);
    toast(
      failed.length ? `Selesai, ${failed.length} gagal: ${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "…" : ""}` : "Screenshot selesai — jangan lupa Simpan",
      failed.length ? "error" : "ok",
    );
  };

  const startNew = () =>
    setEditing({
      isNew: true,
      link: {
        id: "",
        title: "",
        url: "https://",
        company: (co || "lourdes") as PortalLink["company"],
        category: cat || content.categories[0].id,
        type: "halaman",
        description: "",
        tags: [],
        departments: dept ? [dept] : [],
      },
    });

  const remove = (l: PortalLink) => {
    if (!confirm(`Hapus tautan "${l.title}"? Thumbnail-nya juga akan dihapus saat disimpan.`)) return;
    setLinks((ls) => ls.filter((x) => x.id !== l.id));
    toast(`"${l.title}" dihapus`);
  };

  const duplicate = (l: PortalLink) => {
    const copy = { ...l, id: uniqueId(`${l.id}-salinan`, content.links.map((x) => x.id)), title: `${l.title} (salinan)`, thumbnail: undefined };
    setLinks((ls) => {
      const i = ls.findIndex((x) => x.id === l.id);
      return [...ls.slice(0, i + 1), copy, ...ls.slice(i + 1)];
    });
    setEditing({ link: copy, isNew: false });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 shadow-card focus-within:border-brand">
          <Search className="size-4 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul, URL, tag…" className="h-full w-full bg-transparent text-sm outline-none" />
        </label>
        <Select value={co} onChange={(e) => setCo(e.target.value)} className="w-auto" aria-label="Filter perusahaan">
          <option value="">Semua perusahaan</option>
          {content.companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortName}
            </option>
          ))}
        </Select>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-auto" aria-label="Filter kategori">
          <option value="">Semua kategori</option>
          {content.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-auto" aria-label="Filter departemen">
          <option value="">Semua departemen</option>
          {content.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </Select>
        <Button variant={noThumb ? "primary" : "secondary"} onClick={() => setNoThumb((v) => !v)}>
          <ImageOff className="size-4" /> Tanpa thumbnail
        </Button>
        <Button onClick={runBulk} disabled={!!bulk} title="Ambil screenshot otomatis untuk tautan yang tampil & belum punya thumbnail">
          <Camera className="size-4" /> Screenshot otomatis
        </Button>
        <Button variant="primary" onClick={startNew}>
          <Plus className="size-4" /> Tambah tautan
        </Button>
      </div>

      {bulk && (
        <div className="animate-scale-in mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
          <Loader2 className="size-4 shrink-0 animate-spin text-brand" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              Mengambil screenshot {bulk.done + 1}/{bulk.total}: {bulk.current}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${(bulk.done / bulk.total) * 100}%` }} />
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => (stopRef.current = true)}>
            <Square className="size-3.5" /> Hentikan
          </Button>
        </div>
      )}

      <p className="mt-3 text-[13px] text-muted">
        Menampilkan <b className="text-fg">{list.length}</b> dari {content.links.length} tautan · {withThumb} sudah punya thumbnail
      </p>

      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {list.map((l) => (
          <li key={l.id} className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-surface-2/60">
            <button type="button" onClick={() => setEditing({ link: l, isNew: false })} className="shrink-0" aria-label={`Edit ${l.title}`}>
              <AdminThumb link={l} categories={content.categories} className="h-12 w-20 rounded-lg" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setEditing({ link: l, isNew: false })} className="truncate text-left text-sm font-semibold hover:text-brand">
                  {l.title}
                </button>
                {l.featured && <Star className="size-3.5 shrink-0 fill-star text-star" aria-label="Sering dipakai" />}
                {l.internal && <Lock className="size-3.5 shrink-0 text-accent" aria-label="Khusus karyawan" />}
              </div>
              <p className="truncate text-xs text-faint">{displayUrl(l.url)}</p>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium md:flex">
              <span data-company={l.company} className="rounded-md bg-co-soft px-1.5 py-0.5 font-bold uppercase text-co">
                {companyName[l.company]}
              </span>
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-muted">{catLabel[l.category] ?? l.category}</span>
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-muted" title="Jumlah departemen">
                {l.departments.length} dept
              </span>
            </div>
            <div className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <Button variant="ghost" size="sm" onClick={() => setEditing({ link: l, isNew: false })} aria-label="Edit">
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => duplicate(l)} aria-label="Duplikat">
                <Copy className="size-4" />
              </Button>
              <Button variant="danger" size="sm" onClick={() => remove(l)} aria-label="Hapus">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
        {!list.length && <li className="px-4 py-10 text-center text-sm text-muted">Tidak ada tautan yang cocok.</li>}
      </ul>

      {editing && (
        <LinkEditor
          key={editing.link.id || "new"}
          initial={editing.link}
          isNew={editing.isNew}
          content={content}
          onClose={() => setEditing(null)}
          onSave={(link) => {
            setLinks((ls) => (editing.isNew ? [...ls, link] : ls.map((x) => (x.id === editing.link.id ? link : x))));
            toast(editing.isNew ? `"${link.title}" ditambahkan` : `"${link.title}" diperbarui`);
            setEditing(null);
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

function LinkEditor({
  initial,
  isNew,
  content,
  onClose,
  onSave,
  toast,
}: {
  initial: PortalLink;
  isNew: boolean;
  content: PortalContent;
  onClose: () => void;
  onSave: (l: PortalLink) => void;
  toast: Props["toast"];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState<PortalLink>(initial);
  const [idTouched, setIdTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<"" | "upload" | "shot">("");
  const [dragOver, setDragOver] = useState(false);

  const otherIds = content.links.filter((l) => l.id !== initial.id).map((l) => l.id);
  const set = <K extends keyof PortalLink>(k: K, v: PortalLink[K]) => setLink((l) => ({ ...l, [k]: v }));

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const onTitle = (title: string) =>
    setLink((l) => ({ ...l, title, id: idTouched ? l.id : uniqueId(`${content.companies.find((c) => c.id === l.company)?.id}-${title}`, otherIds) }));

  const validate = () => {
    const errs: Record<string, string> = {};
    const r = linkSchema.safeParse(link);
    if (!r.success) for (const i of r.error.issues) errs[String(i.path[0])] ??= i.message;
    if (otherIds.includes(link.id)) errs.id = "ID sudah dipakai tautan lain";
    setErrors(errs);
    return r.success && !errs.id ? r.data : null;
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!link.id || errors.id) {
      setErrors((e) => ({ ...e, id: "Isi judul/ID yang valid dulu sebelum mengunggah thumbnail" }));
      return;
    }
    setUploading("upload");
    try {
      const thumb = await adminApi.uploadThumbnail(link.id, file);
      set("thumbnail", thumb);
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setUploading("");
    }
  };

  const screenshot = async () => {
    if (!link.id || errors.id || !/^https?:\/\/.+\..+/.test(link.url)) {
      setErrors((e) => ({ ...e, url: "Isi judul & URL yang valid dulu" }));
      return;
    }
    setUploading("shot");
    try {
      set("thumbnail", await adminApi.screenshot(link.id, link.url));
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setUploading("");
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validate();
    if (valid) onSave(valid);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={isNew ? "Tambah tautan" : "Edit tautan"}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-xl bg-transparent p-0 text-fg"
    >
      <form onSubmit={save} className="animate-[sheet-left_0.28s_cubic-bezier(0.2,0.8,0.2,1)_both] flex h-full flex-col border-l border-line bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{isNew ? "Tambah tautan" : "Edit tautan"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Tutup">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Thumbnail */}
          <div>
            <span className="text-xs font-semibold text-muted">Thumbnail</span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                upload(e.dataTransfer.files[0]);
              }}
              className={cn(
                "relative mt-1.5 overflow-hidden rounded-2xl border-2 border-dashed transition",
                dragOver ? "border-brand bg-brand-soft" : "border-line",
              )}
            >
              <AdminThumb link={link} categories={content.categories} className="aspect-16/10 w-full" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                <span className="text-xs font-medium text-white/85">
                  {uploading === "shot" ? "Membuka halaman…" : link.thumbnail ? "Rasio 16:10, dipotong dari atas" : "Seret gambar ke sini, upload, atau screenshot"}
                </span>
                <div className="flex gap-1.5">
                  {link.thumbnail && (
                    <Button size="sm" variant="secondary" onClick={() => set("thumbnail", undefined)}>
                      <Trash2 className="size-3.5" /> Hapus
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={screenshot} disabled={!!uploading} title="Ambil screenshot otomatis dari URL">
                    {uploading === "shot" ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />} Screenshot
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
                    {uploading === "upload" ? <Loader2 className="size-3.5 animate-spin" /> : link.thumbnail ? <Upload className="size-3.5" /> : <ImagePlus className="size-3.5" />}
                    {link.thumbnail ? "Ganti" : "Upload"}
                  </Button>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                className="hidden"
                onChange={(e) => {
                  upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="mt-1 text-xs text-faint">PNG/JPG/WebP maks. 8 MB. Disarankan screenshot halaman ±1600×1000 px.</p>
          </div>

          <Field label="Judul" error={errors.title}>
            {(id) => <TextInput id={id} value={link.title} onChange={(e) => onTitle(e.target.value)} invalid={!!errors.title} autoFocus={isNew} />}
          </Field>

          <Field label="URL" error={errors.url}>
            {(id) => <TextInput id={id} type="url" value={link.url} onChange={(e) => set("url", e.target.value)} invalid={!!errors.url} />}
          </Field>

          <Field
            label="ID"
            error={errors.id}
            hint={isNew ? "Dibuat otomatis dari judul. Dipakai untuk favorit & riwayat karyawan." : "ID tidak bisa diubah agar favorit & riwayat karyawan tetap berfungsi."}
          >
            {(id) => (
              <TextInput
                id={id}
                value={link.id}
                disabled={!isNew}
                onChange={(e) => {
                  setIdTouched(true);
                  set("id", e.target.value);
                }}
                invalid={!!errors.id}
                className="font-mono text-[13px]"
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Perusahaan">
              {(id) => (
                <Select id={id} value={link.company} onChange={(e) => set("company", e.target.value as PortalLink["company"])}>
                  {COMPANY_IDS.map((c) => (
                    <option key={c} value={c}>
                      {content.companies.find((x) => x.id === c)?.shortName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Kategori" error={errors.category}>
              {(id) => (
                <Select id={id} value={link.category} onChange={(e) => set("category", e.target.value)}>
                  {content.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Jenis">
              {(id) => (
                <Select id={id} value={link.type} onChange={(e) => set("type", e.target.value as PortalLink["type"])}>
                  {LINK_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field label="Deskripsi" error={errors.description} hint={`${link.description.length}/240`}>
            {(id) => <TextArea id={id} value={link.description} onChange={(e) => set("description", e.target.value)} maxLength={240} invalid={!!errors.description} />}
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Departemen</span>
              <div className="flex gap-2 text-xs">
                <button type="button" className="font-semibold text-brand" onClick={() => set("departments", content.departments.map((d) => d.id))}>
                  Pilih semua
                </button>
                <button type="button" className="font-semibold text-faint hover:text-fg" onClick={() => set("departments", [])}>
                  Kosongkan
                </button>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {content.departments.map((d) => {
                const on = link.departments.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("departments", on ? link.departments.filter((x) => x !== d.id) : [...link.departments, d.id])}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      on ? "border-brand bg-brand text-white dark:text-slate-900" : "border-line text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-faint">Tautan tanpa departemen tetap tampil, tapi tidak muncul saat karyawan memfilter departemen.</p>
          </div>

          <Field label="Tag / kata kunci pencarian" hint="Tekan Enter atau koma untuk menambah. Contoh: absen, presensi.">
            {(id) => <TagsInput id={id} value={link.tags} onChange={(v) => set("tags", v)} placeholder="Tambah tag…" />}
          </Field>

          <div className="grid gap-2 sm:grid-cols-2">
            <Switch checked={!!link.featured} onChange={(v) => set("featured", v || undefined)} label="Sering dipakai" description="Tampil di Akses cepat & diprioritaskan" />
            <Switch checked={!!link.internal} onChange={(v) => set("internal", v || undefined)} label="Khusus karyawan" description="Diberi label “Karyawan”" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary">
            {isNew ? "Tambahkan" : "Terapkan"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
