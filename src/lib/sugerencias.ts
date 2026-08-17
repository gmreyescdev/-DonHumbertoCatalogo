import { prisma } from "@/lib/prisma";
import type { Sugerencia } from "@/components/EditorCotizacion";

/**
 * Precios y cantidades que se proponen al cotizar a un cliente: los de su
 * cotización más reciente. Si nunca se le ha cotizado, devuelve vacío y el
 * editor cae en los precios del catálogo.
 */
export async function sugerenciasPara(
  clienteId: string | undefined,
  excluirNumero?: number
): Promise<Sugerencia> {
  if (!clienteId) return {};

  const ultima = await prisma.cotizacion.findFirst({
    where: {
      clienteId,
      ...(excluirNumero ? { NOT: { numero: excluirNumero } } : {}),
    },
    orderBy: { creadoEn: "desc" },
    select: {
      lineas: {
        select: { productoId: true, cantidadKg: true, precioNeto: true },
      },
    },
  });

  if (!ultima) return {};

  const sugerencias: Sugerencia = {};
  for (const linea of ultima.lineas) {
    if (!linea.productoId) continue;
    sugerencias[linea.productoId] = {
      cantidadKg: linea.cantidadKg,
      precioNeto: linea.precioNeto,
    };
  }
  return sugerencias;
}
