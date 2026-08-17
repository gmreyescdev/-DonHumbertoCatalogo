import sharp from "sharp";
import { prisma } from "@/lib/prisma";

export const MAX_SUBIDA_BYTES = 4 * 1024 * 1024; // 4 MB
export const TIPOS_ACEPTADOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

/** Lado mayor al que se reduce la foto antes de guardarla. */
const LADO_MAXIMO = 1000;

export class ErrorImagen extends Error {}

/**
 * Comprime la foto y la guarda en la base de datos.
 * Devuelve el id de la fila creada en `imagenes`.
 */
export async function guardarImagenSubida(
  archivo: File,
  nombre: string
): Promise<string> {
  if (archivo.size === 0) {
    throw new ErrorImagen("El archivo llegó vacío. Vuelve a intentarlo.");
  }

  if (archivo.size > MAX_SUBIDA_BYTES) {
    throw new ErrorImagen(
      `La foto pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB. El máximo son 4 MB.`
    );
  }

  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    throw new ErrorImagen(
      "Formato no soportado. Usa una foto JPG, PNG, WebP o AVIF."
    );
  }

  const original = Buffer.from(await archivo.arrayBuffer());

  let procesada: Buffer;
  let mimeType: string;

  try {
    const base = sharp(original, { failOn: "error" })
      .rotate() // respeta la orientación EXIF de las fotos de celular
      .resize(LADO_MAXIMO, LADO_MAXIMO, {
        fit: "inside",
        withoutEnlargement: true,
      });

    if (archivo.type === "image/png") {
      procesada = await base.png({ compressionLevel: 9, palette: true }).toBuffer();
      mimeType = "image/png";
    } else {
      procesada = await base
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toBuffer();
      mimeType = "image/jpeg";
    }
  } catch {
    throw new ErrorImagen("No pudimos leer esa imagen. ¿Está dañada?");
  }

  const meta = await sharp(procesada).metadata();

  const fila = await prisma.imagen.create({
    data: {
      nombre: nombre.slice(0, 120),
      mimeType,
      // Prisma espera Uint8Array; Buffer lo es, pero con un ArrayBufferLike
      // más ancho que TypeScript no acepta directamente.
      datos: new Uint8Array(procesada),
      ancho: meta.width ?? 0,
      alto: meta.height ?? 0,
      bytes: procesada.length,
    },
    select: { id: true },
  });

  return fila.id;
}

/** Borra una imagen si ya no la usa ningún producto ni los ajustes. */
export async function borrarImagenSiSobra(
  imagenId: string | null
): Promise<void> {
  if (!imagenId) return;

  const enUso = await prisma.imagen.findUnique({
    where: { id: imagenId },
    select: {
      _count: { select: { productos: true, ajustes: true } },
    },
  });

  if (enUso && enUso._count.productos === 0 && enUso._count.ajustes === 0) {
    await prisma.imagen.delete({ where: { id: imagenId } });
  }
}
