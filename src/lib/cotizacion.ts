/**
 * Cálculo de totales de una cotización.
 *
 * Vive en un solo archivo a propósito: la pantalla de edición, el listado y el
 * PDF tienen que dar exactamente el mismo número, y el cliente compara.
 * Todo en pesos enteros; el IVA se redondea una sola vez, al final.
 */

export type LineaCalculable = {
  cantidadKg: number;
  precioNeto: number;
};

export type Totales = {
  neto: number;
  iva: number;
  total: number;
  kilos: number;
};

export function subtotalDeLinea(linea: LineaCalculable): number {
  return linea.cantidadKg * linea.precioNeto;
}

export function totalesDeCotizacion(
  lineas: LineaCalculable[],
  ivaPorcentaje: number
): Totales {
  const neto = lineas.reduce((suma, l) => suma + subtotalDeLinea(l), 0);
  const kilos = lineas.reduce((suma, l) => suma + l.cantidadKg, 0);
  const iva = Math.round((neto * ivaPorcentaje) / 100);

  return { neto, iva, total: neto + iva, kilos };
}

/** Fecha hasta la que la cotización sigue vigente. */
export function vigenteHasta(emitida: Date, validezDias: number): Date {
  const hasta = new Date(emitida);
  hasta.setDate(hasta.getDate() + validezDias);
  return hasta;
}
