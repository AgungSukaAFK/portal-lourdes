import { Footer } from "./footer";
import { Header } from "./header";
import { CommandPalette } from "./search/command-palette";
import { Toaster } from "./toast";

/** Kerangka halaman portal: header, konten, footer, dan pencarian global. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#konten"
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition focus:translate-y-0"
      >
        Lewati ke konten
      </a>
      <Header />
      <main id="konten">{children}</main>
      <Footer />
      <CommandPalette />
      <Toaster />
    </>
  );
}
