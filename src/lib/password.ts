import bcrypt from "bcryptjs";

// bcryptjs es JavaScript puro: no necesita compilarse y funciona igual en
// Windows, en Linux y en las funciones serverless de Vercel.
const RONDAS = 12;

export function hashPassword(claveEnClaro: string): Promise<string> {
  return bcrypt.hash(claveEnClaro, RONDAS);
}

export function verificarPassword(
  claveEnClaro: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(claveEnClaro, hash);
}

export const CLAVE_MINIMA = 8;

/** Devuelve un mensaje de error, o null si la clave sirve. */
export function validarClave(clave: string): string | null {
  if (clave.length < CLAVE_MINIMA) {
    return `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`;
  }
  return null;
}
