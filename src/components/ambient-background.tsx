/** Latar belakang dekoratif ringan (CSS murni). Animasinya baru berjalan setelah halaman dimuat. */
export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <script
        // Tandai <html> "ready" setelah load + idle; sampai saat itu animasi latar dijeda.
        dangerouslySetInnerHTML={{
          __html: `addEventListener("load",function(){(window.requestIdleCallback||setTimeout)(function(){document.documentElement.classList.add("ready")},{timeout:2500})})`,
        }}
      />
      <div
        className="ambient-blob -left-[15vw] -top-[20vh] size-[60vw] max-w-[900px] bg-[radial-gradient(circle,color-mix(in_srgb,var(--brand)_22%,transparent),transparent_65%)] dark:bg-[radial-gradient(circle,color-mix(in_srgb,var(--brand)_18%,transparent),transparent_65%)]"
        style={{ "--d": "38s", "--x": "10vw", "--y": "8vh" } as React.CSSProperties}
      />
      <div
        className="ambient-blob -right-[18vw] top-[25vh] size-[55vw] max-w-[820px] bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_65%)]"
        style={{ "--d": "46s", "--x": "-12vw", "--y": "-6vh" } as React.CSSProperties}
      />
      <div
        className="ambient-blob bottom-[-25vh] left-[20vw] size-[50vw] max-w-[760px] bg-[radial-gradient(circle,rgb(99_102_241/0.12),transparent_65%)]"
        style={{ "--d": "52s", "--x": "8vw", "--y": "-10vh" } as React.CSSProperties}
      />
      <div className="dot-grid" />
      <span className="energy-line top-[18vh]" style={{ "--d": "13s" } as React.CSSProperties} />
      <span
        className="energy-line top-[46vh]"
        style={{ "--d": "17s", "--delay": "-6s", "--line-color": "var(--accent)" } as React.CSSProperties}
      />
      <span className="energy-line top-[78vh]" style={{ "--d": "21s", "--delay": "-11s" } as React.CSSProperties} />
    </div>
  );
}
