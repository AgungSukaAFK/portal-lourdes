import images from "@/data/images.generated.json";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

type SlideMeta = (typeof images.slides)[number];
const slideByName = Object.fromEntries(images.slides.map((s) => [s.name, s])) as Record<string, SlideMeta>;

export function slideSources(name: string) {
  const s = slideByName[name];
  const set = (fmt: string) => s.widths.map((w) => `/img/slides/${name}-${w}.${fmt} ${w}w`).join(", ");
  return {
    avif: set("avif"),
    webp: set("webp"),
    fallback: `/img/slides/${name}-${s.widths.at(-1)}.webp`,
    blur: s.blur,
    width: s.width,
    height: s.height,
  };
}

export const slideNames = images.slides.map((s) => s.name);

export function logoSrc(name: string, dark = false) {
  const meta = images.logos[name as keyof typeof images.logos];
  const [small, large] = meta.widths;
  const base = `/img/logos/${name}${dark ? "-dark" : ""}`;
  return { x1: `${base}-${small}.webp`, x2: `${base}-${large}.webp`, ratio: meta.ratio };
}
