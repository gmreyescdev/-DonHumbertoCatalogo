import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fecha } from "@/lib/formato";
import { Panel, EnlaceBoton, Etiqueta, Aviso } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; q?: string }>;
}) {
  const { ok, q } = await searchParams;
  const busqueda = q?.trim() ?? "";

  const clientes = await prisma.cliente.findMany({
    where: busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: "insensitive" } },
            { empresa: { contains: busqueda, mode: "insensitive" } },
            { rut: { contains: busqueda, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      empresa: true,
      whatsapp: true,
      direccionDespacho: true,
      activo: true,
      _count: { select: { cotizaciones: true } },
      cotizaciones: {
        orderBy: { creadoEn: "desc" },
        take: 1,
        select: { numero: true, creadoEn: true },
      },
    },
  });

  return (
    <div className="space-y-5">
      {ok === "eliminado" ? (
        <Aviso tipo="ok">Cliente eliminado junto con sus cotizaciones.</Aviso>
      ) : null}

      <Panel
        titulo="Clientes"
        descripcion="Fichas de contacto para dirigir y enviar cotizaciones. No son cuentas de acceso."
        acciones={
          <EnlaceBoton href="/admin/clientes/nuevo">+ Agregar cliente</EnlaceBoton>
        }
      >
        <form method="get" className="mb-5 flex flex-wrap gap-2">
          <input
            name="q"
            type="search"
            defaultValue={busqueda}
            placeholder="Buscar por nombre, empresa o RUT"
            className="min-w-[220px] flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-[15px] focus:border-azul-700 focus:ring-0"
          />
          <button
            type="submit"
            className="rounded-xl bg-azul-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700"
          >
            Buscar
          </button>
          {busqueda ? (
            <Link
              href="/admin/clientes"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Limpiar
            </Link>
          ) : null}
        </form>

        {clientes.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {busqueda
              ? "Ningún cliente coincide con esa búsqueda."
              : "Todavía no hay clientes cargados."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {clientes.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-4 py-4 first:pt-0"
              >
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="font-semibold text-tinta hover:text-azul-700 hover:underline"
                    >
                      {c.nombre}
                    </Link>
                    {!c.activo ? (
                      <Etiqueta tono="apagado">Inactivo</Etiqueta>
                    ) : null}
                  </div>
                  {c.empresa ? (
                    <p className="mt-0.5 text-sm text-slate-600">{c.empresa}</p>
                  ) : null}
                  {c.direccionDespacho ? (
                    <p className="text-xs text-slate-500">
                      Despacho: {c.direccionDespacho}
                    </p>
                  ) : null}
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>
                    {c._count.cotizaciones}{" "}
                    {c._count.cotizaciones === 1 ? "cotización" : "cotizaciones"}
                  </p>
                  {c.cotizaciones[0] ? (
                    <p>
                      Última: N° {c.cotizaciones[0].numero} ·{" "}
                      {fecha(c.cotizaciones[0].creadoEn)}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <EnlaceBoton
                    href={`/admin/cotizaciones/nueva?cliente=${c.id}`}
                    variante="secundario"
                  >
                    Cotizar
                  </EnlaceBoton>
                  <EnlaceBoton
                    href={`/admin/clientes/${c.id}`}
                    variante="fantasma"
                  >
                    Editar
                  </EnlaceBoton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
