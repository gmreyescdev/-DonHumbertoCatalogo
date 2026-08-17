/** Utilidades de formato para pesos chilenos. Sin decimales: el kilo se cobra en pesos enteros. */

const FORMATO_CLP = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0,
});

/** 1770 -> "1.770" */
export function miles(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return FORMATO_CLP.format(valor);
}

/** 1770 -> "$1.770" */
export function pesos(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `$${FORMATO_CLP.format(valor)}`;
}

/** Deja solo dígitos: "1.770" o "$1 770" -> 1770. Devuelve null si queda vacío. */
export function soloDigitos(texto: string): number | null {
  const limpio = texto.replace(/\D/g, "");
  if (!limpio) return null;
  const n = Number.parseInt(limpio, 10);
  return Number.isFinite(n) ? n : null;
}

/** "Poroto Tórtola" -> "poroto-tortola" */
export function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    // Quita las tildes que NFD dejó como marcas combinantes sueltas.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function fecha(valor: Date | string): string {
  const d = typeof valor === "string" ? new Date(valor) : valor;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function fechaHora(valor: Date | string): string {
  const d = typeof valor === "string" ? new Date(valor) : valor;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Variación porcentual entre dos precios, para el historial. */
export function variacion(antes: number | null, ahora: number): string | null {
  if (antes === null || antes === 0) return null;
  const pct = ((ahora - antes) / antes) * 100;
  if (Math.abs(pct) < 0.05) return null;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1).replace(".", ",")}%`;
}
