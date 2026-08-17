"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import type { EstadoAccion } from "@/acciones/productos";

function refrescar(numero?: number) {
  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");
  if (numero) revalidatePath(`/admin/cotizaciones/${numero}`);
}

const entero = (etiqueta: string, min: number, max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length > 0, `Falta ${etiqueta}.`)
    .transform((v) => Number.parseInt(v, 10))
    .refine((n) => n >= min && n <= max, `${etiqueta} está fuera de rango.`);

const esquemaCabecera = z.object({
  clienteId: z.string().trim().min(1, "Elige un cliente."),
  estado: z.enum(["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA"]),
  validezDias: entero("la validez", 1, 365),
  ivaPorcentaje: entero("el IVA", 0, 100),
  condicionDespacho: z.string().trim().max(300).optional(),
  notas: z.string().trim().max(1500).optional(),
});

type LineaLeida = {
  productoId: string;
  nombre: string;
  formato: string;
  cantidadKg: number;
  precioNeto: number;
  orden: number;
};

/**
 * Lee las líneas marcadas como incluidas.
 * El formulario manda una fila por cada producto activo; solo entran a la
 * cotización las que tienen su casilla marcada.
 */
function leerLineas(
  datos: FormData,
  productos: { id: string; nombre: string; formato: string }[]
): { lineas: LineaLeida[] } | { error: string } {
  const lineas: LineaLeida[] = [];

  for (const [indice, p] of productos.entries()) {
    if (datos.get(`incluir_${p.id}`) !== "on") continue;

    const cantidadCruda = String(datos.get(`cantidad_${p.id}`) ?? "").replace(
      /\D/g,
      ""
    );
    const precioCrudo = String(datos.get(`precio_${p.id}`) ?? "").replace(
      /\D/g,
      ""
    );

    const cantidadKg = Number.parseInt(cantidadCruda, 10);
    const precioNeto = Number.parseInt(precioCrudo, 10);

    if (!Number.isFinite(cantidadKg) || cantidadKg <= 0) {
      return { error: `Indica cuántos kilos de ${p.nombre} vas a cotizar.` };
    }
    if (!Number.isFinite(precioNeto) || precioNeto <= 0) {
      return { error: `Indica el precio por kilo de ${p.nombre}.` };
    }
    if (cantidadKg > 10_000_000 || precioNeto > 100_000_000) {
      return { error: `Los valores de ${p.nombre} están fuera de rango.` };
    }

    lineas.push({
      productoId: p.id,
      // Se congelan aquí: si el producto se renombra después, la cotización
      // ya enviada tiene que seguir diciendo lo mismo.
      nombre: p.nombre,
      formato: p.formato,
      cantidadKg,
      precioNeto,
      orden: indice,
    });
  }

  if (lineas.length === 0) {
    return { error: "Marca al menos un producto para cotizar." };
  }

  return { lineas };
}

async function productosDelFormulario(datos: FormData) {
  const ids = datos
    .getAll("producto")
    .filter((v): v is string => typeof v === "string");

  const productos = await prisma.producto.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, formato: true },
  });

  // Se respeta el orden en que venían en el formulario.
  const porId = new Map(productos.map((p) => [p.id, p]));
  return ids.map((id) => porId.get(id)).filter((p) => p !== undefined);
}

export async function crearCotizacion(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  const admin = await requiereAdmin();

  const cabecera = esquemaCabecera.safeParse({
    clienteId: datos.get("clienteId") ?? "",
    estado: datos.get("estado") ?? "BORRADOR",
    validezDias: datos.get("validezDias") ?? "15",
    ivaPorcentaje: datos.get("ivaPorcentaje") ?? "19",
    condicionDespacho: datos.get("condicionDespacho") ?? "",
    notas: datos.get("notas") ?? "",
  });

  if (!cabecera.success) {
    return { error: cabecera.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const productos = await productosDelFormulario(datos);
  const leidas = leerLineas(datos, productos);
  if ("error" in leidas) return { error: leidas.error };

  const v = cabecera.data;

  const creada = await prisma.cotizacion.create({
    data: {
      clienteId: v.clienteId,
      estado: v.estado,
      validezDias: v.validezDias,
      ivaPorcentaje: v.ivaPorcentaje,
      condicionDespacho: v.condicionDespacho || null,
      notas: v.notas || null,
      autorId: admin.id,
      lineas: { create: leidas.lineas },
    },
    select: { numero: true },
  });

  refrescar(creada.numero);
  redirect(`/admin/cotizaciones/${creada.numero}?ok=creada`);
}

export async function actualizarCotizacion(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  await requiereAdmin();

  const numero = Number.parseInt(String(datos.get("numero") ?? ""), 10);
  if (!Number.isFinite(numero)) return { error: "Falta la cotización." };

  const cabecera = esquemaCabecera.safeParse({
    clienteId: datos.get("clienteId") ?? "",
    estado: datos.get("estado") ?? "BORRADOR",
    validezDias: datos.get("validezDias") ?? "15",
    ivaPorcentaje: datos.get("ivaPorcentaje") ?? "19",
    condicionDespacho: datos.get("condicionDespacho") ?? "",
    notas: datos.get("notas") ?? "",
  });

  if (!cabecera.success) {
    return { error: cabecera.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const productos = await productosDelFormulario(datos);
  const leidas = leerLineas(datos, productos);
  if ("error" in leidas) return { error: leidas.error };

  const v = cabecera.data;

  // Se reemplazan las líneas completas: es más simple y seguro que intentar
  // casar cuáles cambiaron, y la cotización es un documento corto.
  await prisma.$transaction([
    prisma.lineaCotizacion.deleteMany({ where: { cotizacionId: numero } }),
    prisma.cotizacion.update({
      where: { numero },
      data: {
        clienteId: v.clienteId,
        estado: v.estado,
        validezDias: v.validezDias,
        ivaPorcentaje: v.ivaPorcentaje,
        condicionDespacho: v.condicionDespacho || null,
        notas: v.notas || null,
        lineas: { create: leidas.lineas },
      },
    }),
  ]);

  refrescar(numero);
  return { ok: "Cotización guardada." };
}

export async function cambiarEstadoCotizacion(datos: FormData): Promise<void> {
  await requiereAdmin();

  const numero = Number.parseInt(String(datos.get("numero") ?? ""), 10);
  const estado = String(datos.get("estado") ?? "");

  if (
    !Number.isFinite(numero) ||
    !["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA"].includes(estado)
  ) {
    return;
  }

  await prisma.cotizacion.update({
    where: { numero },
    data: { estado: estado as "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA" },
  });

  refrescar(numero);
}

export async function eliminarCotizacion(datos: FormData): Promise<void> {
  await requiereAdmin();

  const numero = Number.parseInt(String(datos.get("numero") ?? ""), 10);
  if (!Number.isFinite(numero)) return;

  await prisma.cotizacion.delete({ where: { numero } });

  refrescar();
  redirect("/admin/cotizaciones?ok=eliminada");
}
