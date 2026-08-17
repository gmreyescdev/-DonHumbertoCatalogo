"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { guardarPreciosEnLote, type EstadoAccion } from "@/acciones/productos";
import { miles, soloDigitos, variacion } from "@/lib/formato";
import { Aviso, Boton } from "@/components/ui";

export type FilaPrecio = {
  id: string;
  nombre: string;
  formato: string;
  color: string;
  imagenId: string | null;
  precioNeto: number;
  precioFirme: number;
  activo: boolean;
};

function BotonGuardar({ cambios }: { cambios: number }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending || cambios === 0}>
      {pending
        ? "Guardando…"
        : cambios === 0
          ? "Sin cambios"
          : `Guardar ${cambios} ${cambios === 1 ? "cambio" : "cambios"}`}
    </Boton>
  );
}

export function GrillaPrecios({ filas }: { filas: FilaPrecio[] }) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    guardarPreciosEnLote,
    {}
  );

  // Valores tal como los ve el usuario, con separador de miles.
  const inicial = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const f of filas) {
      mapa[`neto_${f.id}`] = miles(f.precioNeto);
      mapa[`firme_${f.id}`] = miles(f.precioFirme);
    }
    return mapa;
  }, [filas]);

  const [valores, setValores] = useState(inicial);

  // Al recargar tras guardar, `filas` trae los precios nuevos: nos realineamos.
  const [instantanea, setInstantanea] = useState(inicial);
  if (instantanea !== inicial) {
    setInstantanea(inicial);
    setValores(inicial);
  }

  function editar(clave: string, texto: string) {
    const n = soloDigitos(texto);
    setValores((v) => ({ ...v, [clave]: n === null ? "" : miles(n) }));
  }

  const cambiados = filas.filter(
    (f) =>
      soloDigitos(valores[`neto_${f.id}`] ?? "") !== f.precioNeto ||
      soloDigitos(valores[`firme_${f.id}`] ?? "") !== f.precioFirme
  );

  return (
    <form action={accion}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <th className="pb-3 pl-1">Producto</th>
              <th className="pb-3 text-center">Neto + IVA</th>
              <th className="pb-3 text-center">Compra firme</th>
              <th className="pb-3 pr-1 text-right">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const netoAhora = soloDigitos(valores[`neto_${f.id}`] ?? "");
              const firmeAhora = soloDigitos(valores[`firme_${f.id}`] ?? "");
              const cambio =
                netoAhora !== f.precioNeto || firmeAhora !== f.precioFirme;
              const delta =
                netoAhora !== null ? variacion(f.precioNeto, netoAhora) : null;

              return (
                <tr
                  key={f.id}
                  className={cambio ? "bg-dorado-200/25" : undefined}
                >
                  <td className="border-t border-slate-100 py-3 pl-1">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="h-10 w-1.5 shrink-0 rounded"
                        style={{ backgroundColor: f.color }}
                      />
                      {f.imagenId ? (
                        <Image
                          src={`/api/imagenes/${f.imagenId}`}
                          alt=""
                          width={40}
                          height={52}
                          className="h-13 w-10 shrink-0 rounded object-contain"
                          unoptimized
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-tinta">
                          {f.nombre}
                          {!f.activo ? (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                              (oculto)
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {f.formato}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="border-t border-slate-100 px-2 py-3">
                    <CeldaPrecio
                      nombre={`neto_${f.id}`}
                      valor={valores[`neto_${f.id}`] ?? ""}
                      original={f.precioNeto}
                      onChange={(t) => editar(`neto_${f.id}`, t)}
                    />
                  </td>

                  <td className="border-t border-slate-100 px-2 py-3">
                    <CeldaPrecio
                      nombre={`firme_${f.id}`}
                      valor={valores[`firme_${f.id}`] ?? ""}
                      original={f.precioFirme}
                      firme
                      onChange={(t) => editar(`firme_${f.id}`, t)}
                    />
                  </td>

                  <td className="border-t border-slate-100 py-3 pr-1 text-right">
                    {delta ? (
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          delta.startsWith("+") ? "text-rojo-600" : "text-verde-700"
                        }`}
                      >
                        {delta}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <BotonGuardar cambios={cambiados.length} />
        {cambiados.length > 0 ? (
          <Boton
            type="button"
            variante="fantasma"
            onClick={() => setValores(inicial)}
          >
            Descartar cambios
          </Boton>
        ) : null}

        <div className="ml-auto max-w-md">
          {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
          {estado.ok && cambiados.length === 0 ? (
            <Aviso tipo="ok">{estado.ok}</Aviso>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function CeldaPrecio({
  nombre,
  valor,
  original,
  firme,
  onChange,
}: {
  nombre: string;
  valor: string;
  original: number;
  firme?: boolean;
  onChange: (texto: string) => void;
}) {
  const cambio = soloDigitos(valor) !== original;

  return (
    <div
      className={`mx-auto w-36 rounded-xl px-3 py-2 text-center ring-1 transition ${
        firme ? "bg-rojo-100 ring-rojo-600/15" : "bg-azul-50 ring-slate-200"
      } ${cambio ? "ring-2 ring-dorado-500" : ""}`}
    >
      <div className="flex items-baseline justify-center gap-0.5">
        <span
          className={`text-sm font-bold ${firme ? "text-rojo-600" : "text-tinta"}`}
        >
          $
        </span>
        <input
          name={nombre}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          aria-label={`${firme ? "Precio compra firme" : "Precio neto"} en pesos`}
          className={`w-full border-0 bg-transparent p-0 text-center text-xl font-extrabold tabular-nums focus:ring-0 ${
            firme ? "text-rojo-600" : "text-tinta"
          }`}
        />
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400">
        {cambio ? `antes ${miles(original)}` : "por kg"}
      </p>
    </div>
  );
}
