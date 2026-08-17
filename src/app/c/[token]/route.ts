import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Descarga pública de una cotización en PDF.
 *
 * Es la dirección que el cliente recibe por WhatsApp, así que NO pide sesión:
 * el token largo y aleatorio es la única credencial. Caduca a los 90 días.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const pdf = await prisma.pdfCompartido.findUnique({
    where: { token },
    select: {
      id: true,
      datos: true,
      nombreArchivo: true,
      expiraEn: true,
    },
  });

  if (!pdf) {
    return new NextResponse(
      "Este enlace no existe. Pídenos la cotización de nuevo.",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  if (pdf.expiraEn && pdf.expiraEn < new Date()) {
    return new NextResponse(
      "Este enlace ya venció. Escríbenos y te enviamos una cotización actualizada.",
      { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  // Registro de descargas; si falla no debe impedir la descarga.
  prisma.pdfCompartido
    .update({ where: { id: pdf.id }, data: { descargas: { increment: 1 } } })
    .catch(() => {});

  const cuerpo = new Uint8Array(pdf.datos);

  return new NextResponse(cuerpo, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(cuerpo.byteLength),
      // `inline` para que WhatsApp y el navegador móvil lo muestren al tocarlo.
      "Content-Disposition": `inline; filename="${pdf.nombreArchivo.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
