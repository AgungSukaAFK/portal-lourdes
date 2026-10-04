"use client";

import { useEffect, useState } from "react";
import { slideNames, slideSources } from "@/lib/utils";

const INTERVAL = 7000;
const SIZES = "(min-width: 1280px) 1280px, 100vw";

function Slide({ name, active, priority }: { name: string; active: boolean; priority?: boolean }) {
  const s = slideSources(name);
  return (
    <div className="slide absolute inset-0" data-active={active}>
      <picture>
        <source type="image/avif" srcSet={s.avif} sizes={SIZES} />
        <source type="image/webp" srcSet={s.webp} sizes={SIZES} />
        <img
          src={s.fallback}
          alt=""
          width={s.width}
          height={s.height}
          fetchPriority={priority ? "high" : "low"}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover"
          style={priority ? { backgroundImage: `url(${s.blur})`, backgroundSize: "cover" } : undefined}
        />
      </picture>
    </div>
  );
}

/** Slideshow latar hero. Hanya slide pertama yang dimuat di awal; sisanya setelah halaman idle. */
export function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reduce || conn?.saveData) return;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    const id = ric(() => setReady(true));
    return () => (window.cancelIdleCallback ?? clearTimeout)(id as number);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let t: ReturnType<typeof setInterval>;
    const start = () => (t = setInterval(() => setIndex((i) => (i + 1) % slideNames.length), INTERVAL));
    const onVis = () => (document.hidden ? clearInterval(t) : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ready]);

  return (
    <div className="absolute inset-0" aria-hidden>
      {(ready ? slideNames : slideNames.slice(0, 1)).map((name, i) => (
        <Slide key={name} name={name} active={i === index} priority={i === 0} />
      ))}
      {ready && (
        <div className="absolute bottom-4 right-5 z-10 hidden gap-1.5 sm:flex">
          {slideNames.map((n, i) => (
            <span
              key={n}
              className={`h-1 rounded-full bg-white transition-all duration-500 ${i === index ? "w-6 opacity-90" : "w-1.5 opacity-40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
