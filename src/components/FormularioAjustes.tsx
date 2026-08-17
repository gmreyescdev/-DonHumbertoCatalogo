"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { guardarAjustes } from "@/acciones/ajustes";
import type { EstadoAccion } from "@/acciones/productos";
import { Aviso, Campo, Entrada, AreaTexto, Boton } from "@/components/ui";

export type AjustesFormulario = {
  nombreMarca: string;
  eslogan: string;
  titulo: string;
  region: string;
  razonSocial: string;
  rut: string;
  direccion: string;
  correo: string;
  whatsapp: string;
  condiciones: string;
  logoId: string | null;
};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar datos"}
    </Boton>
  );
}

export function FormularioAjustes({ ajustes }: { ajustes: AjustesFormulario }) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    guardarAjustes,
    {}
  );
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  const logoActual = ajustes.logoId ? `/api/imagenes/${ajustes.logoId}` : null;

  return (
    <form action={accion} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Portada del catálogo
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre de la marca" htmlFor="nombreMarca">
            <Entrada
              id="nombreMarca"
              name="nombreMarca"
              required
              maxLength={60}
              defaultValue={ajustes.nombreMarca}
            />
          </Campo>

          <Campo etiqueta="Eslogan" htmlFor="eslogan">
            <Entrada
              id="eslogan"
              name="eslogan"
              maxLength={120}
              defaultValue={ajustes.eslogan}
            />
          </Campo>

          <Campo etiqueta="Título del catálogo" htmlFor="titulo">
            <Entrada
              id="titulo"
              name="titulo"
              required
              maxLength={140}
              defaultValue={ajustes.titulo}
            />
          </Campo>

          <Campo etiqueta="Zona / región" htmlFor="region">
            <Entrada
              id="region"
              name="region"
              maxLength={140}
              defaultValue={ajustes.region}
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Logo"
          htmlFor="logo"
          ayuda="Sale en la portada del catálogo y del PDF. JPG o PNG, hasta 4 MB."
        >
          <div className="mb-3 flex h-24 w-48 items-center justify-center rounded-xl bg-azul-900 p-2 ring-1 ring-slate-200">
            {(vistaPrevia ?? logoActual) !== null ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vistaPrevia ?? logoActual ?? ""}
                alt="Logo actual"
                className="h-full w-auto object-contain"
              />
            ) : (
              <span className="text-xs text-white/60">Sin logo</span>
            )}
          </div>
          <Entrada
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="file:mr-3 file:rounded-lg file:border-0 file:bg-azul-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-azul-800"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
            }}
          />
        </Campo>
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Datos de contacto
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Razón social" htmlFor="razonSocial">
            <Entrada
              id="razonSocial"
              name="razonSocial"
              required
              maxLength={140}
              defaultValue={ajustes.razonSocial}
            />
          </Campo>

          <Campo etiqueta="RUT" htmlFor="rut">
            <Entrada
              id="rut"
              name="rut"
              maxLength={20}
              defaultValue={ajustes.rut}
            />
          </Campo>

          <Campo etiqueta="Dirección" htmlFor="direccion">
            <Entrada
              id="direccion"
              name="direccion"
              maxLength={200}
              defaultValue={ajustes.direccion}
            />
          </Campo>

          <Campo etiqueta="Correo" htmlFor="correo">
            <Entrada
              id="correo"
              name="correo"
              type="email"
              required
              defaultValue={ajustes.correo}
            />
          </Campo>

          <Campo
            etiqueta="WhatsApp"
            htmlFor="whatsapp"
            ayuda="Con código de país, ej: +56 9 5149 9687."
          >
            <Entrada
              id="whatsapp"
              name="whatsapp"
              maxLength={30}
              defaultValue={ajustes.whatsapp}
            />
          </Campo>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Condiciones comerciales
        </h3>

        <Campo
          etiqueta="Condiciones"
          htmlFor="condiciones"
          ayuda="Una condición por línea. Lo que va antes de los dos puntos sale en negrita."
        >
          <AreaTexto
            id="condiciones"
            name="condiciones"
            rows={7}
            maxLength={2000}
            defaultValue={ajustes.condiciones}
          />
        </Campo>
      </section>

      {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
      {estado.ok ? <Aviso tipo="ok">{estado.ok}</Aviso> : null}

      <BotonGuardar />
    </form>
  );
}
