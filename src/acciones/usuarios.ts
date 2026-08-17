"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import { hashPassword, validarClave } from "@/lib/password";
import type { EstadoAccion } from "@/acciones/productos";

function refrescar() {
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
}

const esquemaUsuario = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  nombre: z.string().trim().min(2, "Escribe el nombre del contacto.").max(80),
  empresa: z.string().trim().max(120).optional(),
  telefono: z.string().trim().max(40).optional(),
  rol: z.enum(["ADMIN", "CLIENTE"]),
});

export async function crearUsuario(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  await requiereAdmin();

  const analisis = esquemaUsuario.safeParse({
    email: datos.get("email") ?? "",
    nombre: datos.get("nombre") ?? "",
    empresa: datos.get("empresa") ?? "",
    telefono: datos.get("telefono") ?? "",
    rol: datos.get("rol") ?? "CLIENTE",
  });

  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const clave = String(datos.get("password") ?? "");
  const problema = validarClave(clave);
  if (problema) return { error: problema };

  const v = analisis.data;

  const existe = await prisma.usuario.findUnique({
    where: { email: v.email },
    select: { id: true },
  });
  if (existe) return { error: "Ya hay una cuenta con ese correo." };

  await prisma.usuario.create({
    data: {
      email: v.email,
      nombre: v.nombre,
      empresa: v.empresa || null,
      telefono: v.telefono || null,
      rol: v.rol,
      passwordHash: await hashPassword(clave),
    },
  });

  refrescar();
  return {
    ok: `Cuenta creada para ${v.nombre}. Entrégale el correo y la contraseña.`,
  };
}

export async function actualizarUsuario(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  const admin = await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return { error: "Falta el usuario." };

  const analisis = esquemaUsuario.safeParse({
    email: datos.get("email") ?? "",
    nombre: datos.get("nombre") ?? "",
    empresa: datos.get("empresa") ?? "",
    telefono: datos.get("telefono") ?? "",
    rol: datos.get("rol") ?? "CLIENTE",
  });

  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const v = analisis.data;

  // Nadie puede quitarse a sí mismo el rol de administrador y quedar fuera.
  if (id === admin.id && v.rol !== "ADMIN") {
    return { error: "No puedes quitarte a ti mismo el rol de administrador." };
  }

  const choque = await prisma.usuario.findFirst({
    where: { email: v.email, NOT: { id } },
    select: { id: true },
  });
  if (choque) return { error: "Ese correo ya lo usa otra cuenta." };

  await prisma.usuario.update({
    where: { id },
    data: {
      email: v.email,
      nombre: v.nombre,
      empresa: v.empresa || null,
      telefono: v.telefono || null,
      rol: v.rol,
    },
  });

  const nuevaClave = String(datos.get("password") ?? "");
  if (nuevaClave) {
    const problema = validarClave(nuevaClave);
    if (problema) return { error: problema };
    await prisma.usuario.update({
      where: { id },
      data: { passwordHash: await hashPassword(nuevaClave) },
    });
    refrescar();
    return { ok: "Datos y contraseña actualizados." };
  }

  refrescar();
  return { ok: "Datos actualizados." };
}

export async function alternarUsuarioActivo(datos: FormData): Promise<void> {
  const admin = await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return;

  // Desactivarse a uno mismo dejaría la cuenta sin poder volver a entrar.
  if (id === admin.id) return;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { activo: true },
  });
  if (!usuario) return;

  await prisma.usuario.update({
    where: { id },
    data: { activo: !usuario.activo },
  });

  refrescar();
}

export async function eliminarUsuario(datos: FormData): Promise<void> {
  const admin = await requiereAdmin();

  const id = datos.get("id");
  if (typeof id !== "string" || !id) return;
  if (id === admin.id) return;

  // Queda al menos un administrador activo.
  const objetivo = await prisma.usuario.findUnique({
    where: { id },
    select: { rol: true },
  });
  if (objetivo?.rol === "ADMIN") {
    const admins = await prisma.usuario.count({
      where: { rol: "ADMIN", activo: true },
    });
    if (admins <= 1) return;
  }

  await prisma.usuario.delete({ where: { id } });
  refrescar();
}
