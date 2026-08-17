import { prisma } from "@/lib/prisma";
import { sugerenciasPara } from "@/lib/sugerencias";
import { Panel, Aviso, EnlaceBoton } from "@/components/ui";
import { EditorCotizacion } from "@/components/EditorCotizacion";

export const dynamic = "force-dynamic";

export default async function PaginaCotizacionNueva({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;

  const [clientes, productos] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, empresa: true },
    }),
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        formato: true,
        color: true,
        precioNeto: true,
      },
    }),
  ]);

  const sugerencias = await sugerenciasPara(cliente);

  if (clientes.length === 0) {
    return (
      <Panel titulo="Nueva cotización">
        <Aviso tipo="info">
          Primero necesitas al menos un cliente activo al que cotizarle.
        </Aviso>
        <div className="mt-4">
          <EnlaceBoton href="/admin/clientes/nuevo?cotizar=1">
            Agregar el primer cliente
          </EnlaceBoton>
        </div>
      </Panel>
    );
  }

  if (productos.length === 0) {
    return (
      <Panel titulo="Nueva cotización">
        <Aviso tipo="info">
          No hay productos publicados que cotizar.
        </Aviso>
        <div className="mt-4">
          <EnlaceBoton href="/admin/productos/nuevo">Agregar producto</EnlaceBoton>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      titulo="Nueva cotización"
      descripcion="Marca los productos, ajusta cantidades y precios para este cliente. Los totales se calculan solos."
      acciones={
        <EnlaceBoton href="/admin/clientes/nuevo?cotizar=1" variante="fantasma">
          + Cliente nuevo
        </EnlaceBoton>
      }
    >
      <EditorCotizacion
        clientes={clientes}
        productos={productos}
        sugerencias={sugerencias}
        clienteInicial={cliente}
        condicionPorDefecto=""
      />
    </Panel>
  );
}
