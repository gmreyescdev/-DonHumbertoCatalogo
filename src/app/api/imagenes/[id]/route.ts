import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usuarioActual } from "@/lib/auth";

/**
 * Sirve las fotos guardadas en la base de datos.
 *
 * Requiere sesión: si el catálogo es privado, las imágenes también lo son.
 * Se marcan como `private` en la caché para que ningún proxy compartido las
 * guarde, pero el navegador del cliente sí puede reutilizarlas.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { id } = await params;

  const imagen = await prisma.imagen.findUnique({
    where: { id },
    select: { datos: true, mimeType: true, creadoEn: true },
  });

  if (!imagen) {
    return new NextResponse("Imagen no encontrada", { status: 404 });
  }

  const cuerpo = new Uint8Array(imagen.datos);

  return new NextResponse(cuerpo, {
    headers: {
      "Content-Type": imagen.mimeType,
      "Content-Length": String(cuerpo.byteLength),
      "Cache-Control": "private, max-age=31536000, immutable",
      "Last-Modified": imagen.creadoEn.toUTCString(),
    },
  });
}
