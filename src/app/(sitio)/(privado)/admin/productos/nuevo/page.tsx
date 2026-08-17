import { prisma } from "@/lib/prisma";
import { Panel } from "@/components/ui";
import { FormularioProducto } from "@/components/FormularioProducto";

export const dynamic = "force-dynamic";

export default async function PaginaProductoNuevo() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <Panel
      titulo="Agregar producto"
      descripcion="Los precios van en pesos por kilo, sin decimales."
    >
      <FormularioProducto categorias={categorias} />
    </Panel>
  );
}
