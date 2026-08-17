import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pesos, fechaHora, variacion } from "@/lib/formato";
import { eliminarProducto } from "@/acciones/productos";
import { Panel, Aviso, Etiqueta, claseBoton } from "@/components/ui";
import { FormularioProducto } from "@/components/FormularioProducto";

export const dynamic = "force-dynamic";

export default async function PaginaEditarProducto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;

  const [producto, categorias, historial] = await Promise.all([
    prisma.producto.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        formato: true,
        color: true,
        precioNeto: true,
        precioFirme: true,
        categoriaId: true,
        activo: true,
        destacado: true,
        imagenId: true,
      },
    }),
    prisma.categoria.findMany({
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.historialPrecio.findMany({
      where: { productoId: id },
      orderBy: { creadoEn: "desc" },
      take: 12,
      select: {
        id: true,
        creadoEn: true,
        precioNeto: true,
        precioFirme: true,
        precioNetoAnterior: true,
        autor: { select: { nombre: true } },
      },
    }),
  ]);

  if (!producto) notFound();

  return (
    <div className="space-y-5">
      {ok === "creado" ? (
        <Aviso tipo="ok">
          Producto creado. Ya aparece en el catálogo de tus clientes.
        </Aviso>
      ) : null}

      <Panel
        titulo={`Editar: ${producto.nombre}`}
        descripcion="Los cambios de precio quedan guardados en el historial."
        acciones={
          producto.activo ? (
            <Etiqueta tono="ok">Publicado</Etiqueta>
          ) : (
            <Etiqueta tono="apagado">Oculto</Etiqueta>
          )
        }
      >
        <FormularioProducto producto={producto} categorias={categorias} />
      </Panel>

      <Panel
        titulo="Historial de precios"
        descripcion="Las 12 modificaciones más recientes de este producto."
      >
        {historial.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Sin cambios registrados.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {historial.map((h) => {
              const delta = variacion(h.precioNetoAnterior, h.precioNeto);
              return (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <span className="text-sm text-slate-600">
                    {fechaHora(h.creadoEn)}
                    {h.autor ? ` · ${h.autor.nombre}` : ""}
                  </span>
                  <span className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="font-semibold text-tinta">
                      neto {pesos(h.precioNeto)}
                    </span>
                    <span className="text-rojo-600">
                      firme {pesos(h.precioFirme)}
                    </span>
                    {delta ? (
                      <Etiqueta tono={delta.startsWith("+") ? "dorado" : "ok"}>
                        {delta}
                      </Etiqueta>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        titulo="Eliminar producto"
        descripcion="Se borra junto con su historial de precios. Si solo quieres sacarlo del catálogo, márcalo como oculto."
      >
        <form action={eliminarProducto}>
          <input type="hidden" name="id" value={producto.id} />
          <button type="submit" className={claseBoton("peligro")}>
            Eliminar {producto.nombre} definitivamente
          </button>
        </form>
      </Panel>
    </div>
  );
}
