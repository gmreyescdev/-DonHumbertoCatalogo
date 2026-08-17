import { prisma } from "@/lib/prisma";
import { Panel } from "@/components/ui";
import { FormularioAjustes } from "@/components/FormularioAjustes";
import { GestorCategorias } from "@/components/GestorCategorias";

export const dynamic = "force-dynamic";

const POR_DEFECTO = {
  nombreMarca: "Don Humberto",
  eslogan: "Legumbres premium · desde 1999",
  titulo: "Catálogo Mayorista de Legumbres a Granel",
  region: "Región del Maule · Longaví · Chile",
  razonSocial: "Comercializadora Valle del Maule Ltda",
  rut: "76.160.013-3",
  direccion: "1 Oriente N°833, Longaví, Región del Maule",
  correo: "c.vil.cast@gmail.com",
  whatsapp: "+56 9 5149 9687",
  condiciones: "",
  logoId: null,
};

export default async function PaginaAjustes() {
  const [ajustes, categorias] = await Promise.all([
    prisma.ajustes.findUnique({
      where: { id: "singleton" },
      select: {
        nombreMarca: true,
        eslogan: true,
        titulo: true,
        region: true,
        razonSocial: true,
        rut: true,
        direccion: true,
        correo: true,
        whatsapp: true,
        condiciones: true,
        logoId: true,
      },
    }),
    prisma.categoria.findMany({
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        _count: { select: { productos: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <Panel
        titulo="Datos de la empresa"
        descripcion="Todo esto aparece en el catálogo y en el PDF que envías a tus clientes."
      >
        <FormularioAjustes ajustes={ajustes ?? POR_DEFECTO} />
      </Panel>

      <Panel
        titulo="Categorías"
        descripcion="Sirven para agrupar y filtrar productos. Si borras una, sus productos quedan sin categoría."
      >
        <GestorCategorias categorias={categorias} />
      </Panel>
    </div>
  );
}
