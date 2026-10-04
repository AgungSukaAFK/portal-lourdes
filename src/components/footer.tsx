import Link from "next/link";
import { companies } from "@/data/companies";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo name="lourdes-logo" alt="Lourdes Auto Parts" height={40} />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Portal akses cepat ke seluruh website Lourdes Auto Parts, PT Garuda Mart Indonesia, dan PT Global Inti Sejati.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            {companies
              .filter((c) => c.logo.mark)
              .map((c) => (
                <Link key={c.id} href={`/perusahaan/${c.id}/`} className="opacity-80 transition hover:opacity-100">
                  <Logo name={c.logo.landscape} alt={c.legalName} height={26} />
                </Link>
              ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Website resmi</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {companies.map((c) => (
              <li key={c.id}>
                <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  {c.website.replace("https://", "")}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Portal</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/#direktori" className="hover:text-brand">Direktori tautan</Link></li>
            <li><Link href="/safety-topic/" className="hover:text-brand">Safety Topic</Link></li>
            <li><Link href="/perusahaan/" className="hover:text-brand">Profil perusahaan</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-faint sm:px-6">
          © {new Date().getFullYear()} Lourdes Group · Safety Topic bersumber dari globalinti.com
        </p>
      </div>
    </footer>
  );
}
