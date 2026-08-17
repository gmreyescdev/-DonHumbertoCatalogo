"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  crearProducto,
  actualizarProducto,
  type EstadoAccion,
} from "@/acciones/productos";
import { miles, soloDigitos } from "@/lib/formato";
import {
  Aviso,
  Campo,
  Entrada,
  AreaTexto,
  Selector,
  Casilla,
  Boton,
  EnlaceBoton,
} from "@/components/ui";

export type ProductoFormulario = {
  id: string;
  nombre: string;
  descripcion: string | null;
  formato: string;
  color: string;
  precioNeto: number;
  precioFirme: number;
  categoriaId: string | null;
  activo: boolean;
  destacado: boolean;
  imagenId: string | null;
};

type Categoria = { id: string; nombre: string };

const FORMATO_POR_DEFECTO = "Manga 10 kg c/u · Pallet 1.000–1.200 kg";

function BotonGuardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : nuevo ? "Crear producto" : "Guardar cambios"}
    </Boton>
  );
}

export function FormularioProducto({
  producto,
  categorias,
}: {
  producto?: ProductoFormulario;
  categorias: Categoria[];
}) {
  const nuevo = !producto;
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    nuevo ? crearProducto : actualizarProducto,
    {}
  );

  const [color, setColor] = useState(producto?.color ?? "#153a7a");
  const [neto, setNeto] = useState(
    producto ? miles(producto.precioNeto) : ""
  );
  const [firme, setFirme] = useState(
    producto ? miles(producto.precioFirme) : ""
  );
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  const fotoActual = producto?.imagenId
    ? `/api/imagenes/${producto.imagenId}`
    : null;

  return (
    <form action={accion} className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {producto ? <input type="hidden" name="id" value={producto.id} /> : null}

      {/* Columna principal */}
      <div className="space-y-5">
        <Campo etiqueta="Nombre del producto" htmlFor="nombre">
          <Entrada
            id="nombre"
            name="nombre"
            required
            maxLength={80}
            defaultValue={producto?.nombre}
            placeholder="Poroto Tórtola"
          />
        </Campo>

        <Campo
          etiqueta="Formato de despacho"
          htmlFor="formato"
          ayuda="Aparece bajo el nombre en el catálogo y en el PDF."
        >
          <Entrada
            id="formato"
            name="formato"
            required
            maxLength={160}
            defaultValue={producto?.formato ?? FORMATO_POR_DEFECTO}
          />
        </Campo>

        <Campo
          etiqueta="Descripción (opcional)"
          htmlFor="descripcion"
          ayuda="Un par de líneas sobre calidad, calibre u origen."
        >
          <AreaTexto
            id="descripcion"
            name="descripcion"
            rows={3}
            maxLength={500}
            defaultValue={producto?.descripcion ?? ""}
            placeholder="Grano seleccionado, calibre parejo, cosecha del Maule."
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Precio neto + IVA"
            htmlFor="precioNeto"
            ayuda="Pesos por kilo."
          >
            <Entrada
              id="precioNeto"
              name="precioNeto"
              required
              inputMode="numeric"
              value={neto}
              onChange={(e) => {
                const n = soloDigitos(e.target.value);
                setNeto(n === null ? "" : miles(n));
              }}
              placeholder="1.770"
            />
          </Campo>

          <Campo
            etiqueta="Precio compra firme"
            htmlFor="precioFirme"
            ayuda="Pesos por kilo."
          >
            <Entrada
              id="precioFirme"
              name="precioFirme"
              required
              inputMode="numeric"
              value={firme}
              onChange={(e) => {
                const n = soloDigitos(e.target.value);
                setFirme(n === null ? "" : miles(n));
              }}
              placeholder="1.755"
            />
          </Campo>
        </div>

        {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
        {estado.ok ? <Aviso tipo="ok">{estado.ok}</Aviso> : null}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <BotonGuardar nuevo={nuevo} />
          <EnlaceBoton href="/admin/productos" variante="fantasma">
            Volver al listado
          </EnlaceBoton>
        </div>
      </div>

      {/* Columna lateral */}
      <div className="space-y-5">
        <Campo
          etiqueta="Foto del producto"
          htmlFor="foto"
          ayuda="JPG, PNG o WebP, hasta 4 MB. Se comprime automáticamente."
        >
          <div className="mb-3 flex h-44 items-center justify-center rounded-xl bg-crema p-3 ring-1 ring-slate-200">
            {(vistaPrevia ?? fotoActual) !== null ? (
              // Vista previa local o foto ya guardada; <img> evita el optimizador.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vistaPrevia ?? fotoActual ?? ""}
                alt="Vista previa"
                className="h-full w-auto object-contain"
              />
            ) : (
              <span className="text-sm text-slate-400">Sin foto todavía</span>
            )}
          </div>
          <Entrada
            id="foto"
            name="foto"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="file:mr-3 file:rounded-lg file:border-0 file:bg-azul-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-azul-800"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
            }}
          />
        </Campo>

        <Campo etiqueta="Categoría" htmlFor="categoriaId">
          <Selector
            id="categoriaId"
            name="categoriaId"
            defaultValue={producto?.categoriaId ?? ""}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Selector>
        </Campo>

        <Campo
          etiqueta="Color de acento"
          htmlFor="colorTexto"
          ayuda="Se usa en la barrita de la ficha."
        >
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Elegir color"
              className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            />
            <Entrada
              id="colorTexto"
              name="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              pattern="#[0-9a-fA-F]{6}"
              required
              className="font-mono"
            />
          </div>
        </Campo>

        <div className="space-y-2.5">
          <Casilla
            nombre="activo"
            etiqueta="Publicado"
            defecto={producto?.activo ?? true}
            descripcion="Si lo desmarcas, deja de verse en el catálogo y en el PDF."
          />
          <Casilla
            nombre="destacado"
            etiqueta="Destacado"
            defecto={producto?.destacado ?? false}
            descripcion="Aparece primero y con una insignia dorada."
          />
        </div>
      </div>
    </form>
  );
}
