/**
 * Crea (o actualiza) una cuenta de administrador.
 *
 * Sirve para tres cosas:
 *   1. Dejar el primer administrador en una base recién creada.
 *   2. Agregar otro administrador sin entrar a la aplicación.
 *   3. Recuperar el acceso si se olvidó la contraseña.
 *
 * Si el correo ya existe, NO crea un duplicado: le pone la contraseña nueva,
 * lo deja como ADMIN y lo reactiva.
 *
 * Uso:
 *   npm run crear-admin -- correo@empresa.cl "MiClaveLarga" "Nombre Apellido"
 *
 * Sin argumentos toma ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NOMBRE del .env.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, validarClave } from "../src/lib/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function salirConError(mensaje: string): never {
  console.error(`\n✗ ${mensaje}\n`);
  process.exit(1);
}

async function main() {
  const [emailArg, claveArg, ...nombreArg] = process.argv.slice(2);

  const email = (emailArg ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const clave = claveArg ?? process.env.ADMIN_PASSWORD ?? "";
  const nombre =
    (nombreArg.length > 0 ? nombreArg.join(" ") : process.env.ADMIN_NOMBRE) ??
    "Administrador";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    salirConError(
      'Falta el correo o no es válido.\n  Uso: npm run crear-admin -- correo@empresa.cl "MiClaveLarga" "Nombre"'
    );
  }

  const problema = validarClave(clave);
  if (problema) salirConError(problema);

  if (!process.env.DATABASE_URL) {
    salirConError("Falta DATABASE_URL. Revisa tu .env.");
  }

  const existente = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nombre: true },
  });

  const passwordHash = await hashPassword(clave);

  if (existente) {
    await prisma.usuario.update({
      where: { email },
      data: { passwordHash, rol: "ADMIN", activo: true },
    });
    console.log(`\n✓ Cuenta actualizada: ${email}`);
    console.log("  Contraseña cambiada, rol ADMIN y cuenta activa.\n");
  } else {
    await prisma.usuario.create({
      data: { email, nombre, passwordHash, rol: "ADMIN" },
    });
    console.log(`\n✓ Administrador creado: ${email} (${nombre})\n`);
  }

  const admins = await prisma.usuario.count({
    where: { rol: "ADMIN", activo: true },
  });
  console.log(`  Administradores activos en total: ${admins}`);
  console.log("  Ya puedes entrar con ese correo y esa contraseña.\n");
}

main()
  .catch((e) => {
    console.error("\n✗ Error:", e instanceof Error ? e.message : e, "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
