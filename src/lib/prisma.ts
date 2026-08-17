import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Falta DATABASE_URL. Copia .env.example a .env y completa la conexión a Postgres."
  );
}

function crearCliente() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// En desarrollo Next recarga los módulos en caliente; sin este singleton se
// abriría una conexión nueva en cada recarga hasta agotar el pool.
const global = globalThis as unknown as { prisma?: ReturnType<typeof crearCliente> };

export const prisma = global.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
