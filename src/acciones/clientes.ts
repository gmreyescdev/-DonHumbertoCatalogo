"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import type { EstadoAccion } from "@/acciones/productos";

function refrescar() {
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin");
}

/** Campo de texto opcional: "" se guarda como null, no como cadena vacía. */
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const esquema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre del contacto.").max(80),
  empresa: textoOpcional(120),
  rut: textoOpcional(20),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "El correo no tiene un formato válido."
    ),
  whatsapp: textoOpcional(30),
  telefono: textoOpcional(30),
  direccionDespacho: textoOpcional(200),
  notas: textoOpcional(1000),
  activo: z.boolean(),
});

function leer(datos: FormData) {
  return esquema.safeParse({
    nombre: datos.get("nombre") ?? "",
    empresa: datos.get("empresa") ?? "",
    rut: datos.get("rut") ?? "",
    correo: datos.get("correo") ?? "",
    whatsapp: datos.get("whatsapp") ?? "",
    telefono: datos.get("telefono") ?? "",
    direccionDespacho: datos.get("direccionDespacho") ?? "",
    notas: datos.get("notas") ?? "",
    activo: datos.get("activo") === "on",
  });
}

export async function crearCliente(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  await requiereAdmin();

  const analisis = leer(datos);
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const cliente = await prisma.cliente.create({
    data: analisis.data,
    select: { id: true },
  });

  refrescar();

  // Si el cliente se creó desde el flujo de cotizar, sigue directo a cotizar.
  if (datos.get("luegoCotizar") === "1") {
    redirect(`/admin/cotizaciones/nueva?cliente=${cliente.id}`);
  }

  redirect(`/admin/clientes/${cliente.id}?ok=creado`);
}

export async function actualizarCliente(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return { error: "Falta el cliente." };

  const analisis = leer(datos);
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Revisa los datos." };
  }

  await prisma.cliente.update({ where: { id }, data: analisis.data });

  refrescar();
  return { ok: "Cliente guardado." };
}

export async function eliminarCliente(datos: FormData): Promise<void> {
  await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return;

  // Las cotizaciones del cliente se borran con él (onDelete: Cascade).
  await prisma.cliente.delete({ where: { id } });

  refrescar();
  redirect("/admin/clientes?ok=eliminado");
}
