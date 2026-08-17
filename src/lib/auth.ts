import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { leerCookieSesion } from "@/lib/sesion";
import { ACCESO_CLIENTES_HABILITADO } from "@/lib/acceso";

export type UsuarioActual = {
  id: string;
  email: string;
  nombre: string;
  empresa: string | null;
  rol: "ADMIN" | "CLIENTE";
};

/**
 * Usuario de la petición actual, o null.
 *
 * Consulta la base en vez de confiar solo en la cookie: así, si desactivas o
 * eliminas a un cliente, pierde el acceso de inmediato aunque su sesión siga
 * vigente. `cache` evita repetir la consulta dentro de la misma petición.
 */
export const usuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  const sesion = await leerCookieSesion();
  if (!sesion) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.sub },
    select: {
      id: true,
      email: true,
      nombre: true,
      empresa: true,
      rol: true,
      activo: true,
    },
  });

  if (!usuario || !usuario.activo) return null;

  // Corta también las sesiones ya abiertas de clientes mientras el acceso
  // esté cerrado, sin tener que borrar sus cuentas.
  if (!ACCESO_CLIENTES_HABILITADO && usuario.rol === "CLIENTE") return null;

  const { activo: _activo, ...datos } = usuario;
  return datos;
});

/** Exige sesión iniciada. Si no hay, manda al login y vuelve a `destino` después. */
export async function requiereUsuario(destino?: string): Promise<UsuarioActual> {
  const usuario = await usuarioActual();
  if (!usuario) {
    const query = destino ? `?volver=${encodeURIComponent(destino)}` : "";
    redirect(`/login${query}`);
  }
  return usuario;
}

/** Exige rol ADMIN. Un cliente autenticado que entre al panel vuelve al catálogo. */
export async function requiereAdmin(destino?: string): Promise<UsuarioActual> {
  const usuario = await requiereUsuario(destino);
  if (usuario.rol !== "ADMIN") {
    redirect("/?error=solo-admin");
  }
  return usuario;
}
