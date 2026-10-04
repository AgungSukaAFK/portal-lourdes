import { ArrowRight, ArrowUpRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { companies } from "@/data/companies";
import { links } from "@/data/links";
import { Logo } from "../logo";

export function CompaniesSection() {
  return (
    <section id="perusahaan" className="lazy-section mx-auto mt-16 max-w-7xl scroll-mt-20 px-4 sm:px-6" aria-labelledby="perusahaan-title">
      <h2 id="perusahaan-title" className="text-2xl font-extrabold tracking-tight">
        Perusahaan
      </h2>
      <p className="mt-1 text-sm text-muted">Profil singkat, alamat, dan kontak tiap perusahaan.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {companies.map((c) => (
          <CompanyCard key={c.id} id={c.id} />
        ))}
      </div>
    </section>
  );
}

export function CompanyCard({ id }: { id: (typeof companies)[number]["id"] }) {
  const c = companies.find((x) => x.id === id)!;
  const count = links.filter((l) => l.company === c.id).length;
  return (
    <article
      data-company={c.id}
      className="animate-fade-up link-card group relative flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-card"
    >
      <div className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-co" aria-hidden />
      <div className="flex h-14 items-center">
        <Logo name={c.logo.landscape} alt={c.legalName} height={c.id === "lourdes" ? 52 : 38} className="max-w-full" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-co">{c.tagline}</p>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{c.description}</p>
      <dl className="mt-4 space-y-1.5 text-[13px]">
        {c.address && (
          <div className="flex gap-2">
            <dt className="sr-only">Alamat</dt>
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
            <dd className="text-muted">{c.address}</dd>
          </div>
        )}
        {c.phone && (
          <div className="flex gap-2">
            <dt className="sr-only">Telepon</dt>
            <Phone className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
            <dd>
              <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="relative z-10 text-muted hover:text-co">
                {c.phone}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-5 flex items-center gap-2">
        <Link
          href={`/perusahaan/${c.id}/`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-co-soft px-3 py-2.5 text-sm font-semibold text-co transition hover:brightness-95"
        >
          {count} tautan <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
        <a
          href={c.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-muted transition hover:border-co hover:text-co"
          aria-label={`Kunjungi website ${c.legalName}`}
        >
          Website <ArrowUpRight className="size-4" />
        </a>
      </div>
    </article>
  );
}
