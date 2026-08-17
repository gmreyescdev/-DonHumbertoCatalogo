import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requiereUsuario } from "@/lib/auth";
import { fecha } from "@/lib/formato";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; error?: string }>;
}) {
  const usuario = await requiereUsuario();
  const { q, cat, error } = await searchParams;

  const busqueda = q?.trim() ?? "";

  const filtro: Prisma.ProductoWhereInput = {
    activo: true,
    ...(busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: "insensitive" } },
            { descripcion: { contains: busqueda, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(cat ? { categoria: { slug: cat } } : {}),
  };

  const [productos, categorias, ajustes, ultimoCambio] = await Promise.all([
    prisma.producto.findMany({
      where: filtro,
      orderBy: [{ destacado: "desc" }, { orden: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        formato: true,
        descripcion: true,
        color: true,
        precioNeto: true,
        precioFirme: true,
        destacado: true,
        imagenId: true,
        categoria: { select: { nombre: true } },
      },
    }),
    prisma.categoria.findMany({
      orderBy: { orden: "asc" },
      select: { nombre: true, slug: true, _count: { select: { productos: true } } },
    }),
    prisma.ajustes.findUnique({
      where: { id: "singleton" },
      select: { titulo: true, eslogan: true, region: true, condiciones: true },
    }),
    prisma.producto.findFirst({
      where: { activo: true },
      orderBy: { actualizadoEn: "desc" },
      select: { actualizadoEn: true },
    }),
  ]);

  return (
    <main>
      {/* Portada */}
      <section className="trama-azul text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-dorado-500">
            Lista de precios mayorista
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] font-bold sm:text-6xl">
            {ajustes?.titulo ?? "Catálogo Mayorista de Legumbres a Granel"}
          </h1>
          <div className="my-7 h-1.5 w-24 rounded bg-rojo-600" />
          <p className="max-w-2xl text-base leading-relaxed text-azul-100">
            Hola {usuario.nombre.split(" ")[0]}, esta es la lista de precios base
            en pesos chilenos por kilo. Para cotizar a un cliente con sus propios
            valores, usa{" "}
            <Link
              href="/admin/cotizaciones/nueva"
              className="font-semibold text-dorado-200 underline underline-offset-4"
            >
              Cotizaciones
            </Link>
            . {ajustes?.region ?? ""}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/pdf"
              className="rounded-full bg-dorado-500 px-6 py-3 text-sm font-bold text-azul-950 transition hover:bg-dorado-200"
            >
              Descargar catálogo en PDF
            </Link>
            {ultimoCambio ? (
              <span className="text-sm text-azul-100/75">
                Última actualización de precios: {fecha(ultimoCambio.actualizadoEn)}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {error === "solo-admin" ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-dorado-500/40 bg-dorado-200/40 px-4 py-3 text-sm font-medium text-dorado-600"
          >
            Esa sección es solo para administradores.
          </p>
        ) : null}

        {/* Filtros */}
        <form
          method="get"
          className="-mt-8 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgb(15_44_92/0.1)] ring-1 ring-slate-200/70 sm:p-5"
        >
          <div className="min-w-[200px] flex-1">
            <label
              htmlFor="q"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Buscar producto
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={busqueda}
              placeholder="Poroto, garbanzo, lenteja…"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-[15px] focus:border-azul-700 focus:ring-0"
            />
          </div>

          {categorias.length > 1 ? (
            <div className="min-w-[180px]">
              <label
                htmlFor="cat"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Categoría
              </label>
              <select
                id="cat"
                name="cat"
                defaultValue={cat ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-[15px] focus:border-azul-700 focus:ring-0"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nombre} ({c._count.productos})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <button
            type="submit"
            className="rounded-xl bg-azul-800 px-6 py-2.5 text-[15px] font-semibold text-white transition hover:bg-azul-700"
          >
            Filtrar
          </button>

          {busqueda || cat ? (
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-[15px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-tinta"
            >
              Limpiar
            </Link>
          ) : null}
        </form>

        {/* Productos */}
        <section className="mt-10">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-azul-900">
              Nuestros productos
            </h2>
            <p className="text-sm text-slate-500">
              {productos.length}{" "}
              {productos.length === 1 ? "producto" : "productos"}
            </p>
          </div>

          {productos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center text-slate-500">
              No encontramos productos con ese filtro.{" "}
              <Link href="/" className="font-semibold text-azul-700 underline">
                Ver todos
              </Link>
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((p) => (
                <TarjetaProducto key={p.id} producto={p} />
              ))}
            </div>
          )}

          <p className="mt-6 text-[13px] text-slate-500 italic">
            Precios en CLP por kilo. Valores referenciales sujetos a confirmación
            al momento de cotizar.
          </p>
        </section>

        {/* Condiciones */}
        {ajustes?.condiciones ? (
          <section className="mt-14 rounded-2xl bg-crema p-6 ring-1 ring-dorado-500/25 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-verde-700">
              Condiciones comerciales
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-tinta">
              Cómo comprar
            </h2>
            <ul className="mt-4 space-y-2.5">
              {ajustes.condiciones
                .split("\n")
                .filter((linea) => linea.trim())
                .map((linea) => {
                  const [titulo, ...resto] = linea.split(":");
                  const cuerpo = resto.join(":").trim();
                  return (
                    <li
                      key={linea}
                      className="flex gap-3 text-[15px] leading-relaxed text-slate-700"
                    >
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-dorado-500"
                      />
                      <span>
                        {cuerpo ? (
                          <>
                            <b className="text-azul-800">{titulo}:</b> {cuerpo}
                          </>
                        ) : (
                          linea
                        )}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
