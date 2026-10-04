import { THUMB_WIDTHS } from "@/data/constants";
import type { PortalLink } from "@/data/links";
import { cn, displayUrl } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";

/**
 * Thumbnail tautan (diunggah lewat /admin). Bila belum ada, tampilkan sampul otomatis
 * bernuansa warna perusahaan + ikon kategori, supaya semua kartu tetap seragam.
 */
export function LinkThumb({
  link,
  className,
  iconClass,
  sizes,
  showDomain,
}: {
  link: Pick<PortalLink, "url" | "category" | "thumbnail" | "company">;
  className?: string;
  iconClass?: string;
  sizes: string;
  showDomain?: boolean;
}) {
  if (link.thumbnail) {
    const { file, blur } = link.thumbnail;
    return (
      <img
        src={`/img/thumbs/${file}-${THUMB_WIDTHS[0]}.webp`}
        srcSet={THUMB_WIDTHS.map((w) => `/img/thumbs/${file}-${w}.webp ${w}w`).join(", ")}
        sizes={sizes}
        alt=""
        loading="lazy"
        decoding="async"
        width={THUMB_WIDTHS[0]}
        height={(THUMB_WIDTHS[0] * 10) / 16}
        className={cn("bg-surface-2 object-cover object-top", className)}
        style={{ backgroundImage: `url(${blur})`, backgroundSize: "cover" }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "relative grid place-items-center overflow-hidden bg-co-soft text-co",
        "bg-[radial-gradient(120%_90%_at_100%_0%,color-mix(in_srgb,var(--c)_28%,transparent),transparent_60%),radial-gradient(90%_80%_at_0%_100%,color-mix(in_srgb,var(--c)_16%,transparent),transparent_70%)]",
        className,
      )}
    >
      <span className="thumb-grid absolute inset-0 opacity-50" />
      <CategoryIcon id={link.category} className={cn("relative drop-shadow-sm", iconClass)} />
      {showDomain && (
        <span className="absolute bottom-2 left-3 rounded-md bg-surface/70 px-1.5 py-0.5 text-[10px] font-semibold text-muted backdrop-blur">
          {displayUrl(link.url).split("/")[0]}
        </span>
      )}
    </div>
  );
}
