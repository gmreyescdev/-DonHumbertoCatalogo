import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Esta configuración la usan SOLO los comandos de Prisma (migrate, seed, studio).
 * La aplicación se conecta por su cuenta en src/lib/prisma.ts.
 *
 * Por qué hay dos URLs: en Neon (y en Vercel Postgres) la conexión "pooled" pasa
 * por PgBouncer, que no soporta los locks que `prisma migrate` necesita. Por eso
 * las migraciones van por la conexión directa y la aplicación por la pooled.
 * En local no existe esa distinción y basta con DATABASE_URL.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Se usa `||` y no `??` a propósito: una variable definida pero vacía
    // ("") tiene que tratarse como ausente. Prisma rechaza una cadena vacía.
    url: process.env["MIGRATE_DATABASE_URL"] || process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"] || undefined,
  },
});
