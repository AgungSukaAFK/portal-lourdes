// Skema konten portal. Dipakai API admin (validasi sebelum menyimpan) dan saat build.
// Kode portal hanya mengimpor *tipe*-nya, jadi zod tidak ikut ke bundle browser.
import { z } from "zod";
import { COMPANY_IDS, ICON_NAMES, LINK_TYPE_IDS } from "./constants";

const slug = z
  .string()
  .min(1, "Wajib diisi")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Hanya huruf kecil, angka, dan tanda hubung");
const text = (max: number) => z.string().trim().min(1, "Wajib diisi").max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
const url = z.string().trim().url("URL tidak valid").regex(/^https?:\/\//, "Harus diawali http:// atau https://");

export const thumbnailSchema = z.object({
  file: z.string().regex(/^[a-z0-9-]+$/),
  blur: z.string().startsWith("data:image/"),
});

export const linkSchema = z.object({
  id: slug,
  title: text(90),
  url,
  company: z.enum(COMPANY_IDS),
  category: slug,
  type: z.enum(LINK_TYPE_IDS),
  description: text(240),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  departments: z.array(slug).max(30),
  featured: z.boolean().optional(),
  internal: z.boolean().optional(),
  thumbnail: thumbnailSchema.optional(),
});

export const categorySchema = z.object({
  id: slug,
  label: text(40),
  description: text(120),
  icon: z.enum(ICON_NAMES),
});

export const departmentSchema = z.object({ id: slug, label: text(40) });

export const companySchema = z.object({
  id: z.enum(COMPANY_IDS),
  name: text(80),
  shortName: text(20),
  legalName: text(100),
  tagline: text(120),
  description: text(600),
  website: url,
  logo: z.object({ landscape: z.string(), mark: z.string().optional() }),
  color: z.string(),
  colorDark: z.string(),
  address: optionalText(200),
  phone: optionalText(40),
  email: z.string().trim().email("Email tidak valid").optional().or(z.literal("").transform(() => undefined)),
  hours: optionalText(80),
  mapsQuery: text(200),
  highlights: z.array(z.string().trim().min(1).max(40)).max(6),
  slide: z.string(),
});

export const heroSchema = z.object({
  title: text(80),
  highlight: z.string().trim().max(40),
  subtitle: text(260),
  popular: z.array(z.string()).max(8),
});

export const contentSchema = z
  .object({
    hero: heroSchema,
    departments: z.array(departmentSchema),
    categories: z.array(categorySchema).min(1),
    companies: z.array(companySchema).length(COMPANY_IDS.length),
    links: z.array(linkSchema),
  })
  .superRefine((c, ctx) => {
    const dupes = (ids: string[], path: string) => {
      const seen = new Set<string>();
      ids.forEach((id, i) => {
        if (seen.has(id)) ctx.addIssue({ code: "custom", path: [path, i, "id"], message: `ID "${id}" dipakai lebih dari sekali` });
        seen.add(id);
      });
    };
    dupes(c.links.map((l) => l.id), "links");
    dupes(c.categories.map((x) => x.id), "categories");
    dupes(c.departments.map((x) => x.id), "departments");

    const cats = new Set(c.categories.map((x) => x.id));
    const depts = new Set(c.departments.map((x) => x.id));
    const links = new Set(c.links.map((l) => l.id));
    c.links.forEach((l, i) => {
      if (!cats.has(l.category)) ctx.addIssue({ code: "custom", path: ["links", i, "category"], message: `Kategori "${l.category}" tidak ada` });
      l.departments.forEach((d) => {
        if (!depts.has(d)) ctx.addIssue({ code: "custom", path: ["links", i, "departments"], message: `Departemen "${d}" tidak ada` });
      });
    });
    c.hero.popular.forEach((id, i) => {
      if (!links.has(id)) ctx.addIssue({ code: "custom", path: ["hero", "popular", i], message: `Tautan "${id}" tidak ada` });
    });
  });

export type PortalContent = z.infer<typeof contentSchema>;
export type PortalLink = z.infer<typeof linkSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Department = z.infer<typeof departmentSchema>;
export type Company = z.infer<typeof companySchema> & { id: (typeof COMPANY_IDS)[number] };
export type HeroContent = z.infer<typeof heroSchema>;
export type Thumbnail = z.infer<typeof thumbnailSchema>;
