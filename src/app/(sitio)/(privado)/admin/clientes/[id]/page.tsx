import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pesos, fecha } from "@/lib/formato";
import { totalesDeCotizacion } from "@/lib/cotizacion";
import { eliminarCliente } from "@/acciones/clientes";
import {
  Panel,
  Aviso,
  Etiqueta,
  EnlaceBoton,
  claseBoton,
} from "@/components/ui";
import { FormularioCliente } from "@/components/FormularioCliente";
import { ETIQUETA_ESTADO, TONO_ESTADO } from "@/components/estadoCotizacion";

export const dynamic = "force-dynamic";

export default async function PaginaEditarCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      empresa: true,
      rut: true,
      correo: true,
      whatsapp: true,
      telefono: true,
      direccionDespacho: true,
      notas: true,
      activo: true,
      cotizaciones: {
        orderBy: { creadoEn: "desc" },
        select: {
          numero: true,
          estado: true,
          creadoEn: true,
          ivaPorcentaje: true,
          lineas: { select: { cantidadKg: true, precioNeto: true } },
        },
      },
    },
  });

  if (!cliente) notFound();

  const { cotizaciones, ...datosCliente } = cliente;

  return (
    <div className="space-y-5">
      {ok === "creado" ? <Aviso tipo="ok">Cliente creado.</Aviso> : null}

      <Panel
        titulo={cliente.nombre}
        descripcion={cliente.empresa ?? "Ficha de contacto"}
        acciones={
          <EnlaceBoton href={`/admin/cotizaciones/nueva?cliente=${cliente.id}`}>
            Nueva cotización
          </EnlaceBoton>
        }
      >
        <FormularioCliente cliente={datosCliente} />
      </Panel>

      <Panel
        titulo="Cotizaciones de este cliente"
        descripcion="Al crear una nueva, se proponen los precios de la más reciente."
      >
        {cotizaciones.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Todavía no le has hecho ninguna cotización.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cotizaciones.map((c) => {
              const t = totalesDeCotizacion(c.lineas, c.ivaPorcentaje);
              return (
                <li
                  key={c.numero}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/admin/cotizaciones/${c.numero}`}
                      className="font-semibold text-tinta hover:text-azul-700 hover:underline"
                    >
                      Cotización N° {c.numero}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {fecha(c.creadoEn)} · {c.lineas.length}{" "}
                      {c.lineas.length === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Etiqueta tono={TONO_ESTADO[c.estado]}>
                      {ETIQUETA_ESTADO[c.estado]}
                    </Etiqueta>
                    <span className="font-bold text-tinta tabular-nums">
                      {pesos(t.total)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        titulo="Eliminar cliente"
        descripcion="Se borran también todas sus cotizaciones. Si es temporal, mejor márcalo como inactivo."
      >
        <form action={eliminarCliente}>
          <input type="hidden" name="id" value={cliente.id} />
          <button type="submit" className={claseBoton("peligro")}>
            Eliminar a {cliente.nombre} y sus {cotizaciones.length}{" "}
            {cotizaciones.length === 1 ? "cotización" : "cotizaciones"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
