"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import {
  guardarImagenSubida,
  borrarImagenSiSobra,
  ErrorImagen,
} from "@/lib/imagenes";
import type { EstadoAccion } from "@/acciones/productos";

const esquema = z.object({
  nombreMarca: z.string().trim().min(2, "Escribe el nombre de la marca.").max(60),
  eslogan: z.string().trim().max(120),
  titulo: z.string().trim().min(4, "Escribe el título del catálogo.").max(140),
  region: z.string().trim().max(140),
  razonSocial: z.string().trim().min(2, "Escribe la razón social.").max(140),
  rut: z.string().trim().max(20),
  direccion: z.string().trim().max(200),
  correo: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  whatsapp: z.string().trim().max(30),
  condiciones: z.string().trim().max(2000),
});

export async function guardarAjustes(
  _previo: EstadoAccion,
  datos: FormData
): Promise<EstadoAccion> {
  await requiereAdmin();

  const analisis = esquema.safeParse({
    nombreMarca: datos.get("nombreMarca") ?? "",
    eslogan: datos.get("eslogan") ?? "",
    titulo: datos.get("titulo") ?? "",
    region: datos.get("region") ?? "",
    razonSocial: datos.get("razonSocial") ?? "",
    rut: datos.get("rut") ?? "",
    direccion: datos.get("direccion") ?? "",
    correo: datos.get("correo") ?? "",
    whatsapp: datos.get("whatsapp") ?? "",
    condiciones: datos.get("condiciones") ?? "",
  });

  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const actuales = await prisma.ajustes.findUnique({
    where: { id: "singleton" },
    select: { logoId: true },
  });

  let logoId = actuales?.logoId ?? null;
  const logo = datos.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoId = await guardarImagenSubida(logo, "Logo");
    } catch (e) {
      return {
        error:
          e instanceof ErrorImagen ? e.message : "No pudimos guardar el logo.",
      };
    }
  }

  await prisma.ajustes.upsert({
    where: { id: "singleton" },
    update: { ...analisis.data, logoId },
    create: { id: "singleton", ...analisis.data, logoId },
  });

  if (logoId !== (actuales?.logoId ?? null)) {
    await borrarImagenSiSobra(actuales?.logoId ?? null);
  }

  revalidatePath("/", "layout");
  return { ok: "Datos de la empresa guardados." };
}
