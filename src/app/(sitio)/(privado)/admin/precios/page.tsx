import { prisma } from "@/lib/prisma";
import { Panel, EnlaceBoton } from "@/components/ui";
import { GrillaPrecios } from "@/components/GrillaPrecios";

export const dynamic = "force-dynamic";

export default async function PaginaPrecios() {
  const filas = await prisma.producto.findMany({
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
    },
  });

  return (
    <Panel
      titulo="Actualizar precios"
      descripcion="Escribe directamente sobre el número. Se guarda todo junto y queda registrado en el historial."
      acciones={
        <EnlaceBoton href="/pdf" variante="secundario">
          Generar PDF
        </EnlaceBoton>
      }
    >
      {filas.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Todavía no hay productos.{" "}
          <a
            href="/admin/productos/nuevo"
            className="font-semibold text-azul-700 underline"
          >
            Agrega el primero
          </a>
          .
        </p>
      ) : (
        <GrillaPrecios filas={filas} />
      )}
    </Panel>
  );
}
