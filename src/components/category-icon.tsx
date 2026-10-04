import { categories } from "@/data/links";
import { NamedIcon } from "./named-icon";

const iconByCategory = Object.fromEntries(categories.map((c) => [c.id, c.icon]));

/** Ikon berdasarkan id kategori dari konten portal */
export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  return <NamedIcon name={iconByCategory[id] ?? "globe"} className={className} />;
}
