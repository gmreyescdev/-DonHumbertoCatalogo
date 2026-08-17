import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pesos, fechaHora, variacion } from "@/lib/formato";
import { Panel, EnlaceBoton, Etiqueta } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PaginaResumen() {
  const [productos, activos, clientes, cotizacionesAbiertas, ultimos, sinFoto] =
    await Promise.all([
      prisma.producto.count(),
      prisma.producto.count({ where: { activo: true } }),
      prisma.cliente.count({ where: { activo: true } }),
      prisma.cotizacion.count({
        where: { estado: { in: ["BORRADOR", "ENVIADA"] } },
      }),
      prisma.historialPrecio.findMany({
        take: 8,
        orderBy: { creadoEn: "desc" },
        select: {
          id: true,
          creadoEn: true,
          precioNeto: true,
          precioNetoAnterior: true,
          producto: { select: { nombre: true } },
          autor: { select: { nombre: true } },
        },
      }),
      prisma.producto.count({ where: { imagenId: null } }),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          valor={`${activos}/${productos}`}
          etiqueta="Productos publicados"
          pie="Visibles en el catálogo"
        />
        <Indicador
          valor={String(clientes)}
          etiqueta="Clientes activos"
          pie={`${cotizacionesAbiertas} ${cotizacionesAbiertas === 1 ? "cotización abierta" : "cotizaciones abiertas"}`}
        />
        <Indicador
          valor={String(sinFoto)}
          etiqueta="Productos sin foto"
          pie={sinFoto > 0 ? "Súbeles una imagen" : "Todo en orden"}
          alerta={sinFoto > 0}
        />
        <Indicador
          valor={ultimos[0] ? fechaHora(ultimos[0].creadoEn).split(",")[0] : "—"}
          etiqueta="Último cambio de precio"
          pie={ultimos[0]?.producto.nombre ?? "Sin cambios aún"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          titulo="Últimos cambios de precio"
          descripcion="Cada edición queda registrada con su autor."
          acciones={
            <EnlaceBoton href="/admin/historial" variante="secundario">
              Ver todo
            </EnlaceBoton>
          }
        >
          {ultimos.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Todavía no hay cambios registrados.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {ultimos.map((h) => {
                const delta = variacion(h.precioNetoAnterior, h.precioNeto);
                return (
                  <li
                    key={h.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-tinta">
                        {h.producto.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fechaHora(h.creadoEn)}
                        {h.autor ? ` · ${h.autor.nombre}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm tabular-nums">
                      {h.precioNetoAnterior !== null ? (
                        <span className="text-slate-400 line-through">
                          {pesos(h.precioNetoAnterior)}
                        </span>
                      ) : null}
                      <span className="font-bold text-tinta">
                        {pesos(h.precioNeto)}
                      </span>
                      {delta ? (
                        <Etiqueta tono={delta.startsWith("+") ? "dorado" : "ok"}>
                          {delta}
                        </Etiqueta>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel titulo="Accesos rápidos">
          <div className="grid gap-2.5">
            <AccesoRapido
              href="/admin/cotizaciones/nueva"
              titulo="Nueva cotización"
              texto="Precios propios para un cliente y envío por WhatsApp."
            />
            <AccesoRapido
              href="/admin/precios"
              titulo="Actualizar precios base"
              texto="Edita todos los valores en una sola pantalla."
            />
            <AccesoRapido
              href="/admin/productos/nuevo"
              titulo="Agregar producto"
              texto="Nombre, formato, precios y foto."
            />
            <AccesoRapido
              href="/pdf"
              titulo="Generar el PDF"
              texto="Listo para enviar por WhatsApp."
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Indicador({
  valor,
  etiqueta,
  pie,
  alerta,
}: {
  valor: string;
  etiqueta: string;
  pie: string;
  alerta?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgb(15_44_92/0.07)] ring-1 ring-slate-200/70">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p
        className={`mt-2 font-display text-3xl font-bold tabular-nums ${
          alerta ? "text-rojo-600" : "text-azul-800"
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-xs text-slate-500">{pie}</p>
    </div>
  );
}

function AccesoRapido({
  href,
  titulo,
  texto,
}: {
  href: string;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 px-4 py-3 transition hover:border-azul-700 hover:bg-azul-50"
    >
      <p className="text-sm font-semibold text-azul-800">{titulo}</p>
      <p className="mt-0.5 text-xs text-slate-500">{texto}</p>
    </Link>
  );
}
