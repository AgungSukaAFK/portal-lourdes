"use client";

import type { Company, PortalContent } from "@/data/schema";
import { Logo } from "../logo";
import { Card, Field, TagsInput, TextArea, TextInput } from "./ui";

type Props = { content: PortalContent; update: (fn: (c: PortalContent) => PortalContent) => void };

const fields: { key: keyof Company; label: string; hint?: string; long?: boolean }[] = [
  { key: "legalName", label: "Nama resmi" },
  { key: "name", label: "Nama tampilan" },
  { key: "shortName", label: "Singkatan", hint: "Dipakai di badge & tab, mis. GIS" },
  { key: "tagline", label: "Tagline" },
  { key: "website", label: "Website" },
  { key: "phone", label: "Telepon" },
  { key: "email", label: "Email" },
  { key: "hours", label: "Jam operasional" },
  { key: "address", label: "Alamat", long: true },
  { key: "mapsQuery", label: "Kata kunci Google Maps", hint: "Teks yang dicari saat tombol “Buka di Google Maps” diklik" },
  { key: "description", label: "Deskripsi", long: true },
];

export function CompanyEditor({ content, update }: Props) {
  const set = (id: Company["id"], patch: Partial<Company>) =>
    update((c) => ({ ...c, companies: c.companies.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {content.companies.map((co) => (
        <Card key={co.id} data-company={co.id} className="relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-1 bg-co" aria-hidden />
          <div className="flex h-12 items-center">
            <Logo name={co.logo.landscape} alt={co.legalName} height={co.id === "lourdes" ? 44 : 30} className="max-w-full" />
          </div>
          <div className="mt-4 space-y-4">
            {fields.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                {(id) =>
                  f.long ? (
                    <TextArea id={id} value={(co[f.key] as string) ?? ""} onChange={(e) => set(co.id, { [f.key]: e.target.value || undefined })} />
                  ) : (
                    <TextInput id={id} value={(co[f.key] as string) ?? ""} onChange={(e) => set(co.id, { [f.key]: e.target.value || undefined })} />
                  )
                }
              </Field>
            ))}
            <Field label="Sorotan" hint="Chip singkat di halaman profil (maks. 6)">
              {(id) => <TagsInput id={id} value={co.highlights} onChange={(v) => set(co.id, { highlights: v.slice(0, 6) })} />}
            </Field>
          </div>
        </Card>
      ))}
    </div>
  );
}
