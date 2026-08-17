export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA";

export const ETIQUETA_ESTADO: Record<EstadoCotizacion, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

export const TONO_ESTADO: Record<
  EstadoCotizacion,
  "ok" | "apagado" | "dorado" | "azul"
> = {
  BORRADOR: "apagado",
  ENVIADA: "azul",
  ACEPTADA: "ok",
  RECHAZADA: "dorado",
};

export const ESTADOS: EstadoCotizacion[] = [
  "BORRADOR",
  "ENVIADA",
  "ACEPTADA",
  "RECHAZADA",
];
