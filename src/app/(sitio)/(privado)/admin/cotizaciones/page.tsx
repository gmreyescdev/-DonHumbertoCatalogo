import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pesos, fecha } from "@/lib/formato";
import { totalesDeCotizacion } from "@/lib/cotizacion";
import { Panel, EnlaceBoton, Etiqueta, Aviso } from "@/components/ui";
import { ETIQUETA_ESTADO, TONO_ESTADO } from "@/components/estadoCotizacion";

export const dynamic = "force-dynamic";

export default async function PaginaCotizaciones({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; estado?: string }>;
}) {
  const { ok, estado } = await searchParams;

  const filtroEstado =
    estado && ["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA"].includes(estado)
      ? (estado as "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA")
      : undefined;

  const cotizaciones = await prisma.cotizacion.findMany({
    where: filtroEstado ? { estado: filtroEstado } : undefined,
    orderBy: { numero: "desc" },
    take: 100,
    select: {
      numero: true,
      estado: true,
      creadoEn: true,
      ivaPorcentaje: true,
      cliente: { select: { id: true, nombre: true, empresa: true } },
      autor: { select: { nombre: true } },
      lineas: { select: { cantidadKg: true, precioNeto: true } },
      _count: { select: { pdfs: true } },
    },
  });

  return (
    <div className="space-y-5">
      {ok === "eliminada" ? <Aviso tipo="ok">Cotización eliminada.</Aviso> : null}

      <Panel
        titulo="Cotizaciones"
        descripcion="Precios personalizados por cliente, con su PDF y envío por WhatsApp."
        acciones={
          <EnlaceBoton href="/admin/cotizaciones/nueva">
            + Nueva cotización
          </EnlaceBoton>
        }
      >
        <div className="mb-5 flex flex-wrap gap-1">
          <FiltroEstado actual={estado} valor={undefined} etiqueta="Todas" />
          <FiltroEstado actual={estado} valor="BORRADOR" etiqueta="Borradores" />
          <FiltroEstado actual={estado} valor="ENVIADA" etiqueta="Enviadas" />
          <FiltroEstado actual={estado} valor="ACEPTADA" etiqueta="Aceptadas" />
          <FiltroEstado actual={estado} valor="RECHAZADA" etiqueta="Rechazadas" />
        </div>

        {cotizaciones.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {filtroEstado
              ? "No hay cotizaciones en ese estado."
              : "Todavía no has creado ninguna cotización."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cotizaciones.map((c) => {
              const t = totalesDeCotizacion(c.lineas, c.ivaPorcentaje);
              return (
                <li
                  key={c.numero}
                  className="flex flex-wrap items-center gap-4 py-4 first:pt-0"
                >
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/cotizaciones/${c.numero}`}
                        className="font-semibold text-tinta hover:text-azul-700 hover:underline"
                      >
                        N° {c.numero} · {c.cliente.nombre}
                      </Link>
                      <Etiqueta tono={TONO_ESTADO[c.estado]}>
                        {ETIQUETA_ESTADO[c.estado]}
                      </Etiqueta>
                      {c._count.pdfs > 0 ? (
                        <Etiqueta tono="dorado">Enlace generado</Etiqueta>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {c.cliente.empresa ? `${c.cliente.empresa} · ` : ""}
                      {fecha(c.creadoEn)}
                      {c.autor ? ` · ${c.autor.nombre}` : ""}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-bold text-tinta tabular-nums">
                      {pesos(t.total)}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {c.lineas.length}{" "}
                      {c.lineas.length === 1 ? "producto" : "productos"} ·{" "}
                      {t.kilos.toLocaleString("es-CL")} kg
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <EnlaceBoton
                      href={`/cotizacion/${c.numero}`}
                      variante="secundario"
                    >
                      PDF y envío
                    </EnlaceBoton>
                    <EnlaceBoton
                      href={`/admin/cotizaciones/${c.numero}`}
                      variante="fantasma"
                    >
                      Editar
                    </EnlaceBoton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function FiltroEstado({
  actual,
  valor,
  etiqueta,
}: {
  actual?: string;
  valor?: string;
  etiqueta: string;
}) {
  const activo = actual === valor || (!actual && !valor);
  return (
    <Link
      href={valor ? `/admin/cotizaciones?estado=${valor}` : "/admin/cotizaciones"}
      className={
        activo
          ? "rounded-lg bg-azul-800 px-3.5 py-1.5 text-sm font-semibold text-white"
          : "rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
      }
    >
      {etiqueta}
    </Link>
  );
}
