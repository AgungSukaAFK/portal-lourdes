"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const toggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => setTheme(next));
    } else {
      setTheme(next);
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang/gelap"
      title="Ganti tema"
      className={cn(
        "relative grid size-10 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg active:scale-95",
        className,
      )}
    >
      <Sun className="size-[18px] rotate-0 scale-100 transition-transform duration-500 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-[18px] rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100" />
    </button>
  );
}
