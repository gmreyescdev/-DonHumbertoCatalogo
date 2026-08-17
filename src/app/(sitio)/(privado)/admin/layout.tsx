import type { Metadata } from "next";
import { requiereAdmin } from "@/lib/auth";
import { NavAdmin } from "@/components/NavAdmin";

export const metadata: Metadata = { title: "Administración" };

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  await requiereAdmin("/admin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-dorado-600">
          Panel interno
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold text-azul-900">
          Administración
        </h1>
      </header>

      <div className="mb-8 rounded-2xl bg-slate-200/60 p-1.5">
        <NavAdmin />
      </div>

      {children}
    </div>
  );
}
