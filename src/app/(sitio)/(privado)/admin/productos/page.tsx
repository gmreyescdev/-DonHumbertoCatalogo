import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pesos } from "@/lib/formato";
import { alternarActivo } from "@/acciones/productos";
import { Panel, EnlaceBoton, Etiqueta, Aviso, claseBoton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PaginaProductos({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  const productos = await prisma.producto.findMany({
    orderBy: [{ activo: "desc" }, { orden: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      formato: true,
      color: true,
      imagenId: true,
      precioNeto: true,
      precioFirme: true,
      activo: true,
      destacado: true,
      categoria: { select: { nombre: true } },
    },
  });

  return (
    <div className="space-y-5">
      {ok === "eliminado" ? <Aviso tipo="ok">Producto eliminado.</Aviso> : null}

      <Panel
        titulo="Productos"
        descripcion="Agrega, edita u oculta los productos del catálogo."
        acciones={
          <EnlaceBoton href="/admin/productos/nuevo">
            + Agregar producto
          </EnlaceBoton>
        }
      >
        {productos.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Todavía no hay productos cargados.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {productos.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-4 py-4 first:pt-0"
              >
                <span
                  aria-hidden
                  className="h-12 w-1.5 shrink-0 rounded"
                  style={{ backgroundColor: p.color }}
                />

                <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-crema">
                  {p.imagenId ? (
                    <Image
                      src={`/api/imagenes/${p.imagenId}`}
                      alt=""
                      width={48}
                      height={56}
                      className="h-full w-auto object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">sin foto</span>
                  )}
                </span>

                <div className="min-w-[180px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="font-semibold text-tinta hover:text-azul-700 hover:underline"
                    >
                      {p.nombre}
                    </Link>
                    {p.destacado ? <Etiqueta tono="dorado">Destacado</Etiqueta> : null}
                    {!p.activo ? <Etiqueta tono="apagado">Oculto</Etiqueta> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.categoria ? `${p.categoria.nombre} · ` : ""}
                    {p.formato}
                  </p>
                </div>

                <div className="text-right text-sm tabular-nums">
                  <p className="font-bold text-tinta">{pesos(p.precioNeto)}</p>
                  <p className="text-xs text-rojo-600">
                    firme {pesos(p.precioFirme)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={alternarActivo}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={claseBoton("secundario")}>
                      {p.activo ? "Ocultar" : "Publicar"}
                    </button>
                  </form>
                  <EnlaceBoton
                    href={`/admin/productos/${p.id}`}
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
