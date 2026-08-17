import Image from "next/image";
import Link from "next/link";
import { cerrarSesion } from "@/acciones/auth";
import type { UsuarioActual } from "@/lib/auth";

export function EncabezadoSitio({
  usuario,
  marca,
}: {
  usuario: UsuarioActual;
  marca: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-azul-900/40 bg-azul-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="block w-24 rounded-md bg-white/95 p-1.5">
            <Image
              src="/logo.png"
              alt=""
              width={220}
              height={95}
              className="h-auto w-full"
            />
          </span>
          <span className="font-display text-lg leading-tight font-semibold text-white">
            {marca}
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 sm:order-none sm:ml-auto sm:w-auto">
          <EnlaceNav href="/">Catálogo</EnlaceNav>
          <EnlaceNav href="/pdf">Descargar PDF</EnlaceNav>
          {usuario.rol === "ADMIN" ? (
            <EnlaceNav href="/admin" destacado>
              Administrar
            </EnlaceNav>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <Link
            href="/cuenta"
            className="hidden rounded-lg px-2 py-1 text-right leading-tight transition hover:bg-white/10 sm:block"
          >
            <span className="block text-sm font-semibold text-white">
              {usuario.nombre}
            </span>
            <span className="block text-xs text-azul-100/70">
              {usuario.empresa ?? usuario.email}
            </span>
          </Link>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-lg border border-white/25 px-3 py-2 text-sm font-medium text-white/90 transition hover:border-white/50 hover:bg-white/10"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function EnlaceNav({
  href,
  children,
  destacado,
}: {
  href: string;
  children: React.ReactNode;
  destacado?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        destacado
          ? "rounded-lg bg-dorado-500 px-3 py-2 text-sm font-semibold text-azul-950 transition hover:bg-dorado-200"
          : "rounded-lg px-3 py-2 text-sm font-medium text-azul-100 transition hover:bg-white/10 hover:text-white"
      }
    >
      {children}
    </Link>
  );
}
