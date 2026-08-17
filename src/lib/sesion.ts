import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESION = "dh_sesion";
const DURACION_DIAS = 30;
const DURACION_SEG = DURACION_DIAS * 24 * 60 * 60;

export type DatosSesion = {
  /** id del usuario */
  sub: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "CLIENTE";
};

function claveSecreta(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error(
      "Falta AUTH_SECRET (mínimo 32 caracteres). Genera uno con: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\""
    );
  }
  return new TextEncoder().encode(secreto);
}

export async function firmarSesion(datos: DatosSesion): Promise<string> {
  return new SignJWT({ email: datos.email, nombre: datos.nombre, rol: datos.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(datos.sub)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_DIAS}d`)
    .sign(claveSecreta());
}

export async function verificarSesion(token: string): Promise<DatosSesion | null> {
  try {
    const { payload } = await jwtVerify(token, claveSecreta(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.nombre !== "string" ||
      (payload.rol !== "ADMIN" && payload.rol !== "CLIENTE")
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
    };
  } catch {
    // Token vencido, alterado o firmado con otra clave.
    return null;
  }
}

export async function guardarCookieSesion(datos: DatosSesion): Promise<void> {
  const token = await firmarSesion(datos);
  const store = await cookies();
  store.set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEG,
  });
}

export async function borrarCookieSesion(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_SESION);
}

export async function leerCookieSesion(): Promise<DatosSesion | null> {
  const store = await cookies();
  const token = store.get(COOKIE_SESION)?.value;
  if (!token) return null;
  return verificarSesion(token);
}
