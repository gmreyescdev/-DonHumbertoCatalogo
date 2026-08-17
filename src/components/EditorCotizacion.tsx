"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  crearCotizacion,
  actualizarCotizacion,
} from "@/acciones/cotizaciones";
import type { EstadoAccion } from "@/acciones/productos";
import { miles, pesos, soloDigitos } from "@/lib/formato";
import { totalesDeCotizacion } from "@/lib/cotizacion";
import { ESTADOS, ETIQUETA_ESTADO } from "@/components/estadoCotizacion";
import {
  Aviso,
  Campo,
  Entrada,
  AreaTexto,
  Selector,
  Boton,
  EnlaceBoton,
} from "@/components/ui";

export type ProductoCotizable = {
  id: string;
  nombre: string;
  formato: string;
  color: string;
  precioNeto: number;
};

export type ClienteOpcion = {
  id: string;
  nombre: string;
  empresa: string | null;
};

export type CotizacionEditable = {
  numero: number;
  clienteId: string;
  estado: "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA";
  validezDias: number;
  ivaPorcentaje: number;
  condicionDespacho: string | null;
  notas: string | null;
  lineas: {
    productoId: string | null;
    cantidadKg: number;
    precioNeto: number;
  }[];
};

/** Lo que se propone por producto al abrir el editor. */
export type Sugerencia = Record<string, { cantidadKg: number; precioNeto: number }>;

type Fila = { incluir: boolean; cantidad: string; precio: string };

function BotonGuardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : nuevo ? "Crear cotización" : "Guardar cambios"}
    </Boton>
  );
}

export function EditorCotizacion({
  clientes,
  productos,
  cotizacion,
  sugerencias,
  clienteInicial,
  condicionPorDefecto,
}: {
  clientes: ClienteOpcion[];
  productos: ProductoCotizable[];
  cotizacion?: CotizacionEditable;
  sugerencias: Sugerencia;
  clienteInicial?: string;
  condicionPorDefecto: string;
}) {
  const nuevo = !cotizacion;
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    nuevo ? crearCotizacion : actualizarCotizacion,
    {}
  );

  const inicial = useMemo(() => {
    const mapa: Record<string, Fila> = {};

    const enCotizacion = new Map(
      (cotizacion?.lineas ?? [])
        .filter((l) => l.productoId)
        .map((l) => [l.productoId as string, l])
    );

    for (const p of productos) {
      const linea = enCotizacion.get(p.id);
      const sugerida = sugerencias[p.id];

      if (linea) {
        mapa[p.id] = {
          incluir: true,
          cantidad: miles(linea.cantidadKg),
          precio: miles(linea.precioNeto),
        };
      } else {
        mapa[p.id] = {
          incluir: false,
          cantidad: sugerida ? miles(sugerida.cantidadKg) : "",
          // Si ya le cotizaste antes, se propone ese precio; si no, el del catálogo.
          precio: miles(sugerida?.precioNeto ?? p.precioNeto),
        };
      }
    }
    return mapa;
  }, [productos, cotizacion, sugerencias]);

  const [filas, setFilas] = useState(inicial);
  const [instantanea, setInstantanea] = useState(inicial);
  if (instantanea !== inicial) {
    setInstantanea(inicial);
    setFilas(inicial);
  }

  const [iva, setIva] = useState(String(cotizacion?.ivaPorcentaje ?? 19));

  function editar(id: string, cambio: Partial<Fila>) {
    setFilas((f) => ({ ...f, [id]: { ...f[id], ...cambio } }));
  }

  const lineasActivas = productos
    .filter((p) => filas[p.id]?.incluir)
    .map((p) => ({
      cantidadKg: soloDigitos(filas[p.id].cantidad) ?? 0,
      precioNeto: soloDigitos(filas[p.id].precio) ?? 0,
    }));

  const totales = totalesDeCotizacion(
    lineasActivas,
    soloDigitos(iva) ?? 0
  );

  return (
    <form action={accion} className="space-y-6">
      {cotizacion ? (
        <input type="hidden" name="numero" value={cotizacion.numero} />
      ) : null}

      {/* ------------------------------ Cabecera ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo etiqueta="Cliente" htmlFor="clienteId">
          <Selector
            id="clienteId"
            name="clienteId"
            required
            defaultValue={cotizacion?.clienteId ?? clienteInicial ?? ""}
          >
            <option value="" disabled>
              Elige un cliente…
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.empresa ? ` — ${c.empresa}` : ""}
              </option>
            ))}
          </Selector>
        </Campo>

        <Campo etiqueta="Estado" htmlFor="estado">
          <Selector
            id="estado"
            name="estado"
            defaultValue={cotizacion?.estado ?? "BORRADOR"}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO[e]}
              </option>
            ))}
          </Selector>
        </Campo>

        <Campo etiqueta="Validez (días)" htmlFor="validezDias">
          <Entrada
            id="validezDias"
            name="validezDias"
            inputMode="numeric"
            defaultValue={String(cotizacion?.validezDias ?? 15)}
          />
        </Campo>

        <Campo etiqueta="IVA (%)" htmlFor="ivaPorcentaje">
          <Entrada
            id="ivaPorcentaje"
            name="ivaPorcentaje"
            inputMode="numeric"
            value={iva}
            onChange={(e) => setIva(e.target.value.replace(/\D/g, ""))}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Condición de despacho"
        htmlFor="condicionDespacho"
        ayuda="Sale en la cotización. Es lo que justifica el precio acordado."
      >
        <Entrada
          id="condicionDespacho"
          name="condicionDespacho"
          maxLength={300}
          defaultValue={cotizacion?.condicionDespacho ?? condicionPorDefecto}
          placeholder="Despacho puesto en bodega del cliente, Talca."
        />
      </Campo>

      {/* ------------------------------- Productos ---------------------------- */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Productos a cotizar
          </h3>
          <div className="flex gap-2">
            <Boton
              type="button"
              variante="fantasma"
              onClick={() =>
                setFilas((f) =>
                  Object.fromEntries(
                    Object.entries(f).map(([k, v]) => [k, { ...v, incluir: true }])
                  )
                )
              }
            >
              Marcar todos
            </Boton>
            <Boton
              type="button"
              variante="fantasma"
              onClick={() =>
                setFilas((f) =>
                  Object.fromEntries(
                    Object.entries(f).map(([k, v]) => [
                      k,
                      { ...v, incluir: false },
                    ])
                  )
                )
              }
            >
              Desmarcar
            </Boton>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Incluir</th>
                <th className="px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-right">Cantidad (kg)</th>
                <th className="px-3 py-2.5 text-right">Precio por kg</th>
                <th className="px-3 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const fila = filas[p.id];
                if (!fila) return null;

                const cantidad = soloDigitos(fila.cantidad) ?? 0;
                const precio = soloDigitos(fila.precio) ?? 0;
                const subtotal = fila.incluir ? cantidad * precio : 0;
                const distintoDelCatalogo =
                  fila.incluir && precio > 0 && precio !== p.precioNeto;

                return (
                  <tr
                    key={p.id}
                    className={fila.incluir ? "bg-white" : "bg-slate-50/40"}
                  >
                    <td className="border-t border-slate-100 px-3 py-2.5">
                      {/* Va dentro de la celda: un <input> suelto como hijo de
                          <tr> es HTML inválido y el navegador lo saca de la
                          tabla, lo que rompe la hidratación. */}
                      <input type="hidden" name="producto" value={p.id} />
                      <input
                        type="checkbox"
                        name={`incluir_${p.id}`}
                        checked={fila.incluir}
                        onChange={(e) =>
                          editar(p.id, { incluir: e.target.checked })
                        }
                        aria-label={`Incluir ${p.nombre}`}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-azul-800 focus:ring-azul-700"
                      />
                    </td>

                    <td className="border-t border-slate-100 px-3 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="h-7 w-1 shrink-0 rounded"
                          style={{ backgroundColor: p.color }}
                        />
                        <span>
                          <span
                            className={
                              fila.incluir
                                ? "block font-semibold text-tinta"
                                : "block font-medium text-slate-500"
                            }
                          >
                            {p.nombre}
                          </span>
                          <span className="block text-xs text-slate-400">
                            catálogo {pesos(p.precioNeto)}
                          </span>
                        </span>
                      </span>
                    </td>

                    <td className="border-t border-slate-100 px-3 py-2.5 text-right">
                      <input
                        name={`cantidad_${p.id}`}
                        value={fila.cantidad}
                        onChange={(e) => {
                          const n = soloDigitos(e.target.value);
                          editar(p.id, {
                            cantidad: n === null ? "" : miles(n),
                          });
                        }}
                        inputMode="numeric"
                        disabled={!fila.incluir}
                        placeholder="1.000"
                        aria-label={`Kilos de ${p.nombre}`}
                        className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-right tabular-nums focus:border-azul-700 focus:ring-0 disabled:border-transparent disabled:bg-transparent disabled:text-slate-300"
                      />
                    </td>

                    <td className="border-t border-slate-100 px-3 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-400">$</span>
                        <input
                          name={`precio_${p.id}`}
                          value={fila.precio}
                          onChange={(e) => {
                            const n = soloDigitos(e.target.value);
                            editar(p.id, { precio: n === null ? "" : miles(n) });
                          }}
                          inputMode="numeric"
                          disabled={!fila.incluir}
                          aria-label={`Precio por kilo de ${p.nombre}`}
                          className={`w-24 rounded-lg border px-2.5 py-1.5 text-right font-semibold tabular-nums focus:border-azul-700 focus:ring-0 disabled:border-transparent disabled:bg-transparent disabled:text-slate-300 ${
                            distintoDelCatalogo
                              ? "border-dorado-500 bg-dorado-200/25"
                              : "border-slate-300"
                          }`}
                        />
                      </span>
                    </td>

                    <td className="border-t border-slate-100 px-3 py-2.5 text-right font-bold tabular-nums">
                      {fila.incluir ? (
                        pesos(subtotal)
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* -------------------------------- Totales --------------------------- */}
        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 rounded-xl bg-crema p-4 text-sm ring-1 ring-dorado-500/25">
            <div className="flex justify-between text-slate-600">
              <dt>Kilos totales</dt>
              <dd className="tabular-nums">{miles(totales.kilos)} kg</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Neto</dt>
              <dd className="font-semibold tabular-nums">{pesos(totales.neto)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>IVA {soloDigitos(iva) ?? 0}%</dt>
              <dd className="tabular-nums">{pesos(totales.iva)}</dd>
            </div>
            <div className="flex justify-between border-t border-dorado-500/30 pt-2 text-base">
              <dt className="font-bold text-azul-900">Total</dt>
              <dd className="font-extrabold text-azul-900 tabular-nums">
                {pesos(totales.total)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <Campo
        etiqueta="Notas para el cliente"
        htmlFor="notas"
        ayuda="Salen impresas al final de la cotización."
      >
        <AreaTexto
          id="notas"
          name="notas"
          rows={3}
          maxLength={1500}
          defaultValue={cotizacion?.notas ?? ""}
          placeholder="Precio incluye despacho. Pago a 30 días contra factura."
        />
      </Campo>

      {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
      {estado.ok ? <Aviso tipo="ok">{estado.ok}</Aviso> : null}

      <div className="flex flex-wrap items-center gap-3">
        <BotonGuardar nuevo={nuevo} />
        {cotizacion ? (
          <EnlaceBoton
            href={`/cotizacion/${cotizacion.numero}`}
            variante="secundario"
          >
            Ver PDF y enviar
          </EnlaceBoton>
        ) : null}
        <EnlaceBoton href="/admin/cotizaciones" variante="fantasma">
          Volver al listado
        </EnlaceBoton>
      </div>
    </form>
  );
}
