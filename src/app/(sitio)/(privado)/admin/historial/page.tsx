import { prisma } from "@/lib/prisma";
import { pesos, fechaHora, variacion } from "@/lib/formato";
import { Panel, Etiqueta } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 60;

export default async function PaginaHistorial() {
  const registros = await prisma.historialPrecio.findMany({
    orderBy: { creadoEn: "desc" },
    take: POR_PAGINA,
    select: {
      id: true,
      creadoEn: true,
      precioNeto: true,
      precioFirme: true,
      precioNetoAnterior: true,
      precioFirmeAnterior: true,
      producto: { select: { nombre: true, color: true } },
      autor: { select: { nombre: true } },
    },
  });

  return (
    <Panel
      titulo="Historial de precios"
      descripcion={`Los ${POR_PAGINA} movimientos más recientes, del más nuevo al más antiguo.`}
    >
      {registros.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Todavía no hay cambios registrados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <th className="pb-3">Producto</th>
                <th className="pb-3">Fecha</th>
                <th className="pb-3 text-right">Neto + IVA</th>
                <th className="pb-3 text-right">Compra firme</th>
                <th className="pb-3 text-right">Variación</th>
                <th className="pb-3 pl-4">Autor</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => {
                const delta = variacion(r.precioNetoAnterior, r.precioNeto);
                return (
                  <tr key={r.id}>
                    <td className="border-t border-slate-100 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="h-6 w-1 shrink-0 rounded"
                          style={{ backgroundColor: r.producto.color }}
                        />
                        <span className="font-semibold text-tinta">
                          {r.producto.nombre}
                        </span>
                      </span>
                    </td>
                    <td className="border-t border-slate-100 py-2.5 text-slate-600">
                      {fechaHora(r.creadoEn)}
                    </td>
                    <td className="border-t border-slate-100 py-2.5 text-right tabular-nums">
                      {r.precioNetoAnterior !== null ? (
                        <span className="mr-1.5 text-slate-400 line-through">
                          {pesos(r.precioNetoAnterior)}
                        </span>
                      ) : null}
                      <span className="font-bold text-tinta">
                        {pesos(r.precioNeto)}
                      </span>
                    </td>
                    <td className="border-t border-slate-100 py-2.5 text-right tabular-nums">
                      {r.precioFirmeAnterior !== null ? (
                        <span className="mr-1.5 text-slate-400 line-through">
                          {pesos(r.precioFirmeAnterior)}
                        </span>
                      ) : null}
                      <span className="font-semibold text-rojo-600">
                        {pesos(r.precioFirme)}
                      </span>
                    </td>
                    <td className="border-t border-slate-100 py-2.5 text-right">
                      {delta ? (
                        <Etiqueta tono={delta.startsWith("+") ? "dorado" : "ok"}>
                          {delta}
                        </Etiqueta>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="border-t border-slate-100 py-2.5 pl-4 text-slate-600">
                      {r.autor?.nombre ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
