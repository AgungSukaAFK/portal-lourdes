import { ArrowLeft, ArrowUpRight, Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/category-icon";
import { LinkCard } from "@/components/link-card";
import { Logo } from "@/components/logo";
import { companies, companyById, type CompanyId } from "@/data/companies";
import { categories, links } from "@/data/links";
import { slideSources } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return companies.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = companyById[id as CompanyId];
  return c ? { title: c.legalName, description: c.description } : {};
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = companyById[id as CompanyId];
  if (!c) notFound();

  const own = links.filter((l) => l.company === c.id);
  const groups = categories.map((cat) => ({ cat, items: own.filter((l) => l.category === cat.id) })).filter((g) => g.items.length);
  const s = slideSources(c.slide);
  const others = companies.filter((x) => x.id !== c.id);

  const contact = [
    c.address && { icon: MapPin, label: "Alamat", value: c.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapsQuery)}` },
    c.phone && { icon: Phone, label: "Telepon", value: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, "")}` },
    c.email && { icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}` },
    c.hours && { icon: Clock, label: "Jam operasional", value: c.hours },
    { icon: Globe, label: "Website", value: c.website.replace("https://", ""), href: c.website },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string }[];

  return (
    <div data-company={c.id}>
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <Link href="/perusahaan/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> Semua perusahaan
        </Link>

        <section className="relative mt-4 overflow-hidden rounded-[28px] shadow-pop">
          <picture>
            <source type="image/avif" srcSet={s.avif} sizes="(min-width: 1280px) 1280px, 100vw" />
            <source type="image/webp" srcSet={s.webp} sizes="(min-width: 1280px) 1280px, 100vw" />
            <img
              src={s.fallback}
              alt=""
              width={s.width}
              height={s.height}
              fetchPriority="high"
              className="absolute inset-0 size-full object-cover"
              style={{ backgroundImage: `url(${s.blur})`, backgroundSize: "cover" }}
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
          <div className="relative flex min-h-[260px] flex-col justify-end gap-5 p-5 sm:min-h-[320px] sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div className="animate-fade-up">
              <div className="inline-flex rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
                <Logo name={c.logo.landscape} alt={c.legalName} height={c.id === "lourdes" ? 52 : 36} className="max-w-[70vw]" alwaysLight />
              </div>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">{c.legalName}</h1>
              <p className="mt-1 text-sm font-medium text-white/75 sm:text-base">{c.tagline}</p>
            </div>
            <a
              href={c.website}
              target="_blank"
              rel="noopener noreferrer"
              className="animate-fade-up inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              Buka website <ArrowUpRight className="size-4" />
            </a>
          </div>
        </section>
      </div>

      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <p className="max-w-3xl text-pretty text-[15px] leading-relaxed text-muted">{c.description}</p>
          <div className="flex flex-wrap gap-2">
            {c.highlights.map((h) => (
              <span key={h} className="rounded-full bg-co-soft px-3 py-1 text-xs font-semibold text-co">
                {h}
              </span>
            ))}
          </div>

          {groups.map(({ cat, items }) => (
            <section key={cat.id} aria-labelledby={`g-${cat.id}`}>
              <h2 id={`g-${cat.id}`} className="mb-3 flex items-center gap-2 text-sm font-bold">
                <CategoryIcon id={cat.id} className="size-4 text-co" />
                {cat.label}
                <span className="rounded-md bg-surface-2 px-1.5 text-xs font-semibold text-muted">{items.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((l, i) => (
                  <LinkCard key={l.id} link={l} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <h2 className="font-bold">Kontak & lokasi</h2>
            <ul className="mt-4 space-y-4">
              {contact.map((x) => (
                <li key={x.label} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-co-soft text-co">
                    <x.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs text-faint">{x.label}</span>
                    <span className="block text-sm font-medium">
                      {x.href ? (
                        <a href={x.href} target={x.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="break-words hover:text-co">
                          {x.value}
                        </a>
                      ) : (
                        x.value
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-co px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 dark:text-slate-900"
            >
              <MapPin className="size-4" /> Buka di Google Maps
            </a>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-sm font-bold">Perusahaan lain</h2>
            <div className="mt-3 space-y-2">
              {others.map((o) => (
                <Link
                  key={o.id}
                  href={`/perusahaan/${o.id}/`}
                  data-company={o.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line p-3 transition hover:border-co"
                >
                  <Logo name={o.logo.landscape} alt={o.legalName} height={o.id === "lourdes" ? 34 : 22} className="max-w-[200px]" />
                  <ArrowUpRight className="size-4 shrink-0 text-faint" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
