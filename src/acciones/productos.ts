"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import { aSlug } from "@/lib/formato";
import {
  guardarImagenSubida,
  borrarImagenSiSobra,
  ErrorImagen,
} from "@/lib/imagenes";

export type EstadoAccion = { error?: string; ok?: string };

function refrescar() {
  revalidatePath("/", "layout");
}

const numeroDesdeTexto = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length > 0, "Escribe un precio.")
  .transform((v) => Number.parseInt(v, 10))
  .refine((n) => n > 0 && n < 100_000_000, "El precio está fuera de rango.");

const esquemaProducto = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto.").max(80),
  descripcion: z.string().trim().max(500).optional(),
  formato: z.string().trim().min(2, "Indica el formato de despacho.").max(160),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser hexadecimal, ej: #153a7a."),
  precioNeto: numeroDesdeTexto,
  precioFirme: numeroDesdeTexto,
  categoriaId: z.string().trim().optional(),
  activo: z.boolean(),
  destacado: z.boolean(),
});

function leerFormulario(datos: FormData) {
  return esquemaProducto.safeParse({
    nombre: datos.get("nombre") ?? "",
    descripcion: datos.get("descripcion") ?? "",
    formato: datos.get("formato") ?? "",
    color: datos.get("color") ?? "",
    precioNeto: datos.get("precioNeto") ?? "",
    precioFirme: datos.get("precioFirme") ?? "",
    categoriaId: datos.get("categoriaId") ?? "",
    activo: datos.get("activo") === "on",
    destacado: datos.get("destacado") === "on",
  });
}

/** Genera un slug único agregando -2, -3… si ya existe. */
async function slugUnico(nombre: string, excluirId?: string): Promise<string> {
  const base = aSlug(nombre) || "producto";
  let candidato = base;
  let n = 2;

  while (true) {
    const choque = await prisma.producto.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!choque || choque.id === excluirId) return candidato;
    candidato = `${base}-${n++}`;
  }
}

export async function crearProducto(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  const admin = await requiereAdmin();
  const analisis = leerFormulario(datos);

  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const v = analisis.data;

  let imagenId: string | null = null;
  const foto = datos.get("foto");
  if (foto instanceof File && foto.size > 0) {
    try {
      imagenId = await guardarImagenSubida(foto, v.nombre);
    } catch (e) {
      return {
        error:
          e instanceof ErrorImagen ? e.message : "No pudimos guardar la foto.",
      };
    }
  }

  const ultimo = await prisma.producto.findFirst({
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  const creado = await prisma.producto.create({
    data: {
      slug: await slugUnico(v.nombre),
      nombre: v.nombre,
      descripcion: v.descripcion || null,
      formato: v.formato,
      color: v.color,
      precioNeto: v.precioNeto,
      precioFirme: v.precioFirme,
      categoriaId: v.categoriaId || null,
      activo: v.activo,
      destacado: v.destacado,
      imagenId,
      orden: (ultimo?.orden ?? 0) + 1,
      historial: {
        create: {
          precioNeto: v.precioNeto,
          precioFirme: v.precioFirme,
          autorId: admin.id,
        },
      },
    },
    select: { id: true },
  });

  refrescar();
  redirect(`/admin/productos/${creado.id}?ok=creado`);
}

export async function actualizarProducto(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  const admin = await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return { error: "Falta el producto." };

  const analisis = leerFormulario(datos);
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const v = analisis.data;

  const actual = await prisma.producto.findUnique({
    where: { id },
    select: { precioNeto: true, precioFirme: true, imagenId: true, nombre: true },
  });
  if (!actual) return { error: "Ese producto ya no existe." };

  let imagenId = actual.imagenId;
  const foto = datos.get("foto");
  if (foto instanceof File && foto.size > 0) {
    try {
      imagenId = await guardarImagenSubida(foto, v.nombre);
    } catch (e) {
      return {
        error:
          e instanceof ErrorImagen ? e.message : "No pudimos guardar la foto.",
      };
    }
  }

  const cambioPrecio =
    actual.precioNeto !== v.precioNeto || actual.precioFirme !== v.precioFirme;

  await prisma.producto.update({
    where: { id },
    data: {
      slug: await slugUnico(v.nombre, id),
      nombre: v.nombre,
      descripcion: v.descripcion || null,
      formato: v.formato,
      color: v.color,
      precioNeto: v.precioNeto,
      precioFirme: v.precioFirme,
      categoriaId: v.categoriaId || null,
      activo: v.activo,
      destacado: v.destacado,
      imagenId,
      ...(cambioPrecio
        ? {
            historial: {
              create: {
                precioNetoAnterior: actual.precioNeto,
                precioFirmeAnterior: actual.precioFirme,
                precioNeto: v.precioNeto,
                precioFirme: v.precioFirme,
                autorId: admin.id,
              },
            },
          }
        : {}),
    },
  });

  // Si la foto cambió, la anterior queda huérfana y ocupa espacio.
  if (imagenId !== actual.imagenId) await borrarImagenSiSobra(actual.imagenId);

  refrescar();
  return { ok: "Producto guardado." };
}

export async function eliminarProducto(datos: FormData): Promise<void> {
  await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return;

  const producto = await prisma.producto.findUnique({
    where: { id },
    select: { imagenId: true },
  });

  await prisma.producto.delete({ where: { id } });
  await borrarImagenSiSobra(producto?.imagenId ?? null);

  refrescar();
  redirect("/admin/productos?ok=eliminado");
}

export async function alternarActivo(datos: FormData): Promise<void> {
  await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return;

  const producto = await prisma.producto.findUnique({
    where: { id },
    select: { activo: true },
  });
  if (!producto) return;

  await prisma.producto.update({
    where: { id },
    data: { activo: !producto.activo },
  });

  refrescar();
}

/**
 * Guarda de una sola vez todos los precios editados en la grilla rápida.
 * Solo escribe (y registra en el historial) los que realmente cambiaron.
 */
export async function guardarPreciosEnLote(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  const admin = await requiereAdmin();

  const productos = await prisma.producto.findMany({
    select: { id: true, nombre: true, precioNeto: true, precioFirme: true },
  });

  const cambios: {
    id: string;
    nombre: string;
    neto: number;
    firme: number;
    netoAntes: number;
    firmeAntes: number;
  }[] = [];

  for (const p of productos) {
    const netoCrudo = datos.get(`neto_${p.id}`);
    const firmeCrudo = datos.get(`firme_${p.id}`);
    if (typeof netoCrudo !== "string" || typeof firmeCrudo !== "string") continue;

    const neto = Number.parseInt(netoCrudo.replace(/\D/g, ""), 10);
    const firme = Number.parseInt(firmeCrudo.replace(/\D/g, ""), 10);

    if (!Number.isFinite(neto) || !Number.isFinite(firme)) {
      return { error: `Revisa los precios de ${p.nombre}: deben ser números.` };
    }
    if (neto <= 0 || firme <= 0) {
      return { error: `Los precios de ${p.nombre} deben ser mayores que cero.` };
    }

    if (neto !== p.precioNeto || firme !== p.precioFirme) {
      cambios.push({
        id: p.id,
        nombre: p.nombre,
        neto,
        firme,
        netoAntes: p.precioNeto,
        firmeAntes: p.precioFirme,
      });
    }
  }

  if (cambios.length === 0) {
    return { ok: "No había cambios que guardar." };
  }

  await prisma.$transaction(
    cambios.flatMap((c) => [
      prisma.producto.update({
        where: { id: c.id },
        data: { precioNeto: c.neto, precioFirme: c.firme },
      }),
      prisma.historialPrecio.create({
        data: {
          productoId: c.id,
          precioNetoAnterior: c.netoAntes,
          precioFirmeAnterior: c.firmeAntes,
          precioNeto: c.neto,
          precioFirme: c.firme,
          autorId: admin.id,
        },
      }),
    ])
  );

  refrescar();
  return {
    ok:
      cambios.length === 1
        ? `Precio actualizado: ${cambios[0].nombre}.`
        : `${cambios.length} precios actualizados.`,
  };
}

export async function crearCategoria(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  await requiereAdmin();

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Escribe un nombre de categoría." };

  const slug = aSlug(nombre);
  const existe = await prisma.categoria.findFirst({
    where: { OR: [{ nombre }, { slug }] },
    select: { id: true },
  });
  if (existe) return { error: "Esa categoría ya existe." };

  const ultima = await prisma.categoria.findFirst({
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  await prisma.categoria.create({
    data: { nombre, slug, orden: (ultima?.orden ?? 0) + 1 },
  });

  refrescar();
  return { ok: `Categoría "${nombre}" creada.` };
}

export async function eliminarCategoria(datos: FormData): Promise<void> {
  await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return;

  // Los productos quedan sin categoría (onDelete: SetNull), no se borran.
  await prisma.categoria.delete({ where: { id } });
  refrescar();
}
