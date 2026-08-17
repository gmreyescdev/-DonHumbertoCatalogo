import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(AQUI, "seed-assets");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type ProductoSemilla = {
  id: string;
  nombre: string;
  fmt: string;
  neto: number;
  firme: number;
  color: string;
};

async function guardarImagen(archivo: string, nombre: string) {
  const ruta = path.join(ASSETS, archivo);
  const datos = await fs.readFile(ruta);
  const meta = await sharp(datos).metadata();

  return prisma.imagen.create({
    data: {
      nombre,
      mimeType: archivo.endsWith(".png") ? "image/png" : "image/jpeg",
      datos: new Uint8Array(datos),
      ancho: meta.width ?? 0,
      alto: meta.height ?? 0,
      bytes: datos.length,
    },
    select: { id: true },
  });
}

async function main() {
  const crudo = await fs.readFile(path.join(ASSETS, "productos.json"), "utf8");
  const { products } = JSON.parse(crudo) as { products: ProductoSemilla[] };

  // --- Administrador inicial ---------------------------------------------
  const email = (process.env.ADMIN_EMAIL ?? "admin@donhumberto.cl").toLowerCase();
  const clave = process.env.ADMIN_PASSWORD;
  if (!clave) throw new Error("Falta ADMIN_PASSWORD en el .env");

  const admin = await prisma.usuario.upsert({
    where: { email },
    update: { rol: "ADMIN", activo: true },
    create: {
      email,
      nombre: process.env.ADMIN_NOMBRE ?? "Administrador",
      empresa: "Comercializadora Valle del Maule Ltda",
      passwordHash: await hashPassword(clave),
      rol: "ADMIN",
    },
  });
  console.log(`✓ Administrador: ${admin.email}`);

  // --- Categoría por defecto ---------------------------------------------
  const legumbres = await prisma.categoria.upsert({
    where: { slug: "legumbres" },
    update: {},
    create: { nombre: "Legumbres", slug: "legumbres", orden: 1 },
  });

  // --- Logo y ajustes de la empresa --------------------------------------
  const ajustesExistentes = await prisma.ajustes.findUnique({
    where: { id: "singleton" },
  });

  if (!ajustesExistentes) {
    const logo = await guardarImagen("logo.png", "Logo Valle del Maule");
    await prisma.ajustes.create({ data: { id: "singleton", logoId: logo.id } });
    console.log("✓ Ajustes de la empresa creados (con logo)");
  }

  // --- Productos ----------------------------------------------------------
  let creados = 0;
  for (const [i, p] of products.entries()) {
    const yaExiste = await prisma.producto.findUnique({ where: { slug: p.id } });
    if (yaExiste) {
      console.log(`· ${p.nombre} ya existía, se deja como está`);
      continue;
    }

    const imagen = await guardarImagen(`${p.id}.jpg`, p.nombre);

    await prisma.producto.create({
      data: {
        slug: p.id,
        nombre: p.nombre,
        formato: p.fmt,
        color: p.color,
        precioNeto: p.neto,
        precioFirme: p.firme,
        orden: i + 1,
        categoriaId: legumbres.id,
        imagenId: imagen.id,
        historial: {
          create: {
            precioNeto: p.neto,
            precioFirme: p.firme,
            autorId: admin.id,
          },
        },
      },
    });
    creados++;
    console.log(`✓ ${p.nombre}  neto $${p.neto} · firme $${p.firme}`);
  }

  console.log(`\nListo: ${creados} productos nuevos.`);
  console.log(`Entra con ${admin.email} y la contraseña de ADMIN_PASSWORD.`);
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
