import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";

/** Un PDF compartido caduca a los 90 días. */
const DIAS_VIGENCIA = 90;
const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Recibe el PDF que se generó en el navegador y lo guarda con un token.
 * Devuelve el enlace que se le manda al cliente por WhatsApp.
 *
 * El PDF se arma en el navegador (html2canvas no existe en el servidor), así
 * que hay que devolverlo aquí para poder darle una dirección estable.
 */
export async function POST(peticion: Request) {
  await requiereAdmin();

  const formulario = await peticion.formData();
  const archivo = formulario.get("archivo");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: "No llegó el PDF." }, { status: 400 });
  }

  if (archivo.type !== "application/pdf") {
    return NextResponse.json(
      { error: "El archivo no es un PDF." },
      { status: 400 }
    );
  }

  if (archivo.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "El PDF pesa demasiado para guardarlo." },
      { status: 413 }
    );
  }

  const numeroCrudo = formulario.get("cotizacion");
  const numero =
    typeof numeroCrudo === "string" && numeroCrudo
      ? Number.parseInt(numeroCrudo, 10)
      : null;

  if (numero !== null && !Number.isFinite(numero)) {
    return NextResponse.json(
      { error: "Número de cotización inválido." },
      { status: 400 }
    );
  }

  const enviadoA = formulario.get("enviadoA");
  const nombreCrudo = formulario.get("nombreArchivo");

  const datos = new Uint8Array(await archivo.arrayBuffer());

  // 32 bytes al azar: el enlace es la única credencial para abrir el PDF.
  const token = randomBytes(32).toString("base64url");

  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + DIAS_VIGENCIA);

  await prisma.pdfCompartido.create({
    data: {
      token,
      nombreArchivo:
        typeof nombreCrudo === "string" && nombreCrudo
          ? nombreCrudo.slice(0, 120)
          : "cotizacion.pdf",
      datos,
      bytes: datos.byteLength,
      cotizacionId: numero,
      enviadoA: typeof enviadoA === "string" ? enviadoA.slice(0, 40) : null,
      expiraEn,
    },
  });

  const origen = new URL(peticion.url).origin;

  return NextResponse.json({
    url: `${origen}/c/${token}`,
    token,
    expiraEn: expiraEn.toISOString(),
  });
}
