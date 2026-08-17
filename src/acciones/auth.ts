"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarPassword, hashPassword, validarClave } from "@/lib/password";
import { guardarCookieSesion, borrarCookieSesion } from "@/lib/sesion";
import { usuarioActual } from "@/lib/auth";
import {
  ACCESO_CLIENTES_HABILITADO,
  MENSAJE_ACCESO_CERRADO,
} from "@/lib/acceso";

export type EstadoFormulario = { error?: string; ok?: string };

// Hash de descarte: si el correo no existe igual se hace una comparación, para
// que el tiempo de respuesta no delate qué correos están registrados.
const HASH_SEÑUELO =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7bLLL5x4b1lLLtvnQ1Q1x9tqPMYaKvC";

const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export async function iniciarSesion(
  _previo: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const analisis = esquemaLogin.safeParse({
    email: datos.get("email"),
    password: datos.get("password"),
  });

  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Datos incompletos." };
  }

  const { email, password } = analisis.data;

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      passwordHash: true,
    },
  });

  const correcta = await verificarPassword(
    password,
    usuario?.passwordHash ?? HASH_SEÑUELO
  );

  // Mensaje genérico a propósito: no revela si falló el correo o la contraseña.
  if (!usuario || !correcta) {
    return { error: "Correo o contraseña incorrectos." };
  }

  if (!usuario.activo) {
    return {
      error: "Tu cuenta está desactivada. Contáctanos para reactivarla.",
    };
  }

  if (!ACCESO_CLIENTES_HABILITADO && usuario.rol === "CLIENTE") {
    return { error: MENSAJE_ACCESO_CERRADO };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcceso: new Date() },
  });

  await guardarCookieSesion({
    sub: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
  });

  const volver = datos.get("volver");
  // Solo rutas internas: evita que un enlace manipulado redirija a otro sitio.
  const destino =
    typeof volver === "string" && /^\/(?!\/)/.test(volver) ? volver : "/";

  redirect(destino);
}

export async function cerrarSesion(): Promise<void> {
  await borrarCookieSesion();
  redirect("/login");
}

const esquemaClave = z
  .object({
    actual: z.string().min(1, "Escribe tu contraseña actual."),
    nueva: z.string(),
    repetir: z.string(),
  })
  .refine((d) => d.nueva === d.repetir, {
    message: "La contraseña nueva y su repetición no coinciden.",
  });

export async function cambiarMiClave(
  _previo: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const analisis = esquemaClave.safeParse({
    actual: datos.get("actual"),
    nueva: datos.get("nueva"),
    repetir: datos.get("repetir"),
  });

  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Datos incompletos." };
  }

  const problema = validarClave(analisis.data.nueva);
  if (problema) return { error: problema };

  const fila = await prisma.usuario.findUnique({
    where: { id: usuario.id },
    select: { passwordHash: true },
  });
  if (!fila) return { error: "No encontramos tu cuenta." };

  const correcta = await verificarPassword(analisis.data.actual, fila.passwordHash);
  if (!correcta) return { error: "Tu contraseña actual no es correcta." };

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash: await hashPassword(analisis.data.nueva) },
  });

  return { ok: "Listo, tu contraseña quedó actualizada." };
}
