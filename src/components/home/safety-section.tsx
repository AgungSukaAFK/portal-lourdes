"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDate, useLatestSafety, useSafetyCompany } from "@/lib/safety";

export function SafetySection() {
  const company = useSafetyCompany();
  const { posts, total, available } = useLatestSafety(7, company);
  const list = posts.slice(1, 7);
  // Perusahaan tanpa safety topic (mis. GMI) sudah ditandai di kartu hero; bagian ini disembunyikan.
  if (!available || !list.length) return null;

  return (
    <section className="lazy-section mx-auto mt-16 max-w-7xl px-4 sm:px-6" aria-labelledby="safety-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="safety-title" className="text-2xl font-extrabold tracking-tight">
            Safety Topic {company.toUpperCase()} sebelumnya
          </h2>
          <p className="mt-1 text-sm text-muted">
            Materi safety talk {company.toUpperCase()}{total ? ` — ${total.toLocaleString("id-ID")} topik tersedia` : ""}.
          </p>
        </div>
        <Link href="/safety-topic/" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          Lihat arsip <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <SafetyCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}

export function SafetyCard({
  post,
  index = 0,
  company = "gis",
}: {
  post: { id: number; date: string; link: string; title: string; excerpt: string };
  index?: number;
  company?: string;
}) {
  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      data-company={company}
      style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
      className="animate-fade-up link-card group flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card"
    >
      <div className="flex items-center justify-between">
        <time dateTime={post.date} className="rounded-md bg-co-soft px-2 py-0.5 text-[11px] font-bold text-co">
          {formatDate(post.date)}
        </time>
        <ArrowUpRight className="link-arrow size-4 text-faint" aria-hidden />
      </div>
      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug">{post.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{post.excerpt}</p>
    </a>
  );
}
