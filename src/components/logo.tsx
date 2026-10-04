import { logoSrc, cn } from "@/lib/utils";

/** Logo yang otomatis berganti versi terang/gelap via CSS (tanpa mengunduh keduanya). */
export function Logo({
  name,
  alt,
  height,
  className,
  alwaysLight,
}: {
  name: string;
  alt: string;
  height: number;
  className?: string;
  /** Pakai versi asli walau tema gelap (mis. logo di atas latar putih). */
  alwaysLight?: boolean;
}) {
  const light = logoSrc(name);
  const dark = logoSrc(name, !alwaysLight);
  const set = (s: typeof light) => `image-set(url(${s.x1}) 1x, url(${s.x2}) 2x)`;
  return (
    <span
      role="img"
      aria-label={alt}
      className={cn("logo-img inline-block shrink-0", className)}
      style={
        {
          height,
          width: Math.round(height * light.ratio),
          "--logo-l": set(light),
          "--logo-d": set(dark),
        } as React.CSSProperties
      }
    />
  );
}
