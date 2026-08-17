"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin", etiqueta: "Resumen" },
  { href: "/admin/cotizaciones", etiqueta: "Cotizaciones" },
  { href: "/admin/clientes", etiqueta: "Clientes" },
  { href: "/admin/precios", etiqueta: "Precios" },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/historial", etiqueta: "Historial" },
  { href: "/admin/usuarios", etiqueta: "Equipo" },
  { href: "/admin/ajustes", etiqueta: "Empresa" },
];

export function NavAdmin() {
  const ruta = usePathname();

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {SECCIONES.map((s) => {
        const activo =
          s.href === "/admin" ? ruta === "/admin" : ruta.startsWith(s.href);

        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activo ? "page" : undefined}
            className={
              activo
                ? "shrink-0 rounded-lg bg-azul-800 px-4 py-2 text-sm font-semibold text-white"
                : "shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-azul-800"
            }
          >
            {s.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
