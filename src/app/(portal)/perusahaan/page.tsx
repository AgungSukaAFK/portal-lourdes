import type { Metadata } from "next";
import { CompanyCard } from "@/components/home/companies-section";
import { companies } from "@/data/companies";

export const metadata: Metadata = { title: "Perusahaan" };

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
      <h1 className="animate-fade-up text-3xl font-extrabold tracking-tight sm:text-4xl">Perusahaan</h1>
      <p className="animate-fade-up mt-2 max-w-2xl text-muted" style={{ "--i": 1 } as React.CSSProperties}>
        Lourdes Auto Parts beserta dua distributornya, PT Garuda Mart Indonesia dan PT Global Inti Sejati.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {companies.map((c) => (
          <CompanyCard key={c.id} id={c.id} />
        ))}
      </div>
    </div>
  );
}
