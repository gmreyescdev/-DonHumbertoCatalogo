/**
 * Revisa las variables de entorno antes de compilar.
 *
 * Sin esto, un olvido en el panel de Vercel produce errores difíciles de leer
 * ("Connection url is empty") o, peor, una compilación que se queda colgada
 * esperando un bloqueo que el pooler nunca concede.
 */

// En local las variables están en .env; en Vercel vienen del panel y no hay
// archivo que cargar. `loadEnvFile` es de Node, así que no añade dependencias.
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables del entorno tal cual.
}

const problemas = [];
const avisos = [];

const baseDatos = process.env.DATABASE_URL ?? "";
const migraciones = process.env.MIGRATE_DATABASE_URL ?? "";
const secreto = process.env.AUTH_SECRET ?? "";

// --- Conexión de la aplicación ---------------------------------------------
if (!baseDatos) {
  problemas.push(
    "Falta DATABASE_URL.\n" +
      "     Es la cadena de Neon CON el sufijo -pooler en el host.\n" +
      "     En Vercel: Settings > Environment Variables."
  );
}

// --- Conexión de las migraciones -------------------------------------------
const baseEsPooler = baseDatos.includes("-pooler");

if (!migraciones && baseEsPooler) {
  problemas.push(
    "Falta MIGRATE_DATABASE_URL y DATABASE_URL apunta al pooler.\n" +
      "     Las migraciones no pueden pasar por el pooler: se quedarían\n" +
      "     colgadas esperando un bloqueo. Agrega MIGRATE_DATABASE_URL con la\n" +
      "     misma cadena pero SIN el sufijo -pooler en el host."
  );
}

if (migraciones.includes("-pooler")) {
  problemas.push(
    "MIGRATE_DATABASE_URL apunta al pooler (su host lleva -pooler).\n" +
      "     Debe ser la conexión directa, sin ese sufijo. Con el pooler,\n" +
      "     prisma migrate se cuelga."
  );
}

if (migraciones && !baseEsPooler && baseDatos) {
  avisos.push(
    "DATABASE_URL no lleva -pooler. Funciona, pero en producción conviene\n" +
      "     usar la conexión agrupada para no agotar las conexiones."
  );
}

// --- Clave de sesiones ------------------------------------------------------
if (!secreto) {
  problemas.push(
    "Falta AUTH_SECRET.\n" +
      "     Genérala con:\n" +
      "     node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\""
  );
} else if (secreto.length < 32) {
  problemas.push(
    `AUTH_SECRET es muy corta (${secreto.length} caracteres). Mínimo 32.`
  );
}

// --- Resultado --------------------------------------------------------------
for (const aviso of avisos) {
  console.warn(`\n  [aviso] ${aviso}`);
}

if (problemas.length > 0) {
  console.error("\n" + "=".repeat(70));
  console.error("  NO SE PUEDE COMPILAR: faltan variables de entorno");
  console.error("=".repeat(70));
  for (const [i, problema] of problemas.entries()) {
    console.error(`\n  ${i + 1}. ${problema}`);
  }
  console.error(
    "\n  Después de agregarlas en Vercel hay que volver a desplegar:\n" +
      "  el panel no reconstruye solo al cambiar una variable.\n"
  );
  console.error("=".repeat(70) + "\n");
  process.exit(1);
}

console.log("Variables de entorno correctas.");
