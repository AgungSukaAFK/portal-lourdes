"use client";

// Tombol "Admin" + dialog login di landing. Hanya dirender saat `next dev` (lihat header.tsx).
import { LayoutDashboard, LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "./admin-api";
import { LoginForm } from "./login-form";

export default function AdminEntry() {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    adminApi.session().then((s) => setAuthed(s.authenticated)).catch(() => {});
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => (authed ? router.push("/admin/") : setOpen(true))}
        title={authed ? "Buka halaman admin" : "Masuk admin (localhost)"}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-line-strong px-2.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
      >
        {authed ? <LayoutDashboard className="size-4" /> : <LockKeyhole className="size-4" />}
        <span className="hidden sm:inline">Admin</span>
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        aria-label="Masuk admin"
        className="m-auto w-[calc(100%-2rem)] max-w-sm overflow-visible bg-transparent p-0 text-fg"
      >
        {open && (
          <div className="animate-scale-in relative rounded-3xl border border-line bg-surface p-6 shadow-pop">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-fg"
              aria-label="Tutup"
            >
              <X className="size-4" />
            </button>
            <LoginForm
              onSuccess={() => {
                setOpen(false);
                router.push("/admin/");
              }}
            />
          </div>
        )}
      </dialog>
    </>
  );
}
