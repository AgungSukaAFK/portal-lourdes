// Konstanta yang dipakai bersama oleh portal, admin, dan validasi skema.

export const COMPANY_IDS = ["lourdes", "gmi", "gis"] as const;
export type CompanyId = (typeof COMPANY_IDS)[number];

export const LINK_TYPE_IDS = ["website", "halaman", "formulir", "katalog", "artikel"] as const;

export const LINK_TYPES: readonly { id: (typeof LINK_TYPE_IDS)[number]; label: string }[] = [
  { id: "website", label: "Website" },
  { id: "halaman", label: "Halaman" },
  { id: "formulir", label: "Formulir" },
  { id: "katalog", label: "Katalog Produk" },
  { id: "artikel", label: "Artikel" },
];
export type LinkType = (typeof LINK_TYPE_IDS)[number];

/** Ikon yang bisa dipilih untuk kategori (lihat components/category-icon.tsx). */
export const ICON_NAMES = [
  "globe",
  "clipboard-check",
  "hard-hat",
  "package",
  "briefcase",
  "building",
  "help",
  "cart",
  "book",
  "users",
  "wrench",
  "truck",
  "wallet",
  "chart",
  "shield",
  "file-text",
  "graduation-cap",
  "megaphone",
  "zap",
  "calendar",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** Ukuran thumbnail yang dihasilkan (px lebar). */
export const THUMB_WIDTHS = [400, 800] as const;
