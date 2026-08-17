"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  crearCategoria,
  eliminarCategoria,
  type EstadoAccion,
} from "@/acciones/productos";
import { Aviso, Entrada, Boton, Etiqueta, claseBoton } from "@/components/ui";

type Categoria = {
  id: string;
  nombre: string;
  _count: { productos: number };
};

function BotonAgregar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Agregando…" : "Agregar"}
    </Boton>
  );
}

export function GestorCategorias({ categorias }: { categorias: Categoria[] }) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    crearCategoria,
    {}
  );

  return (
    <div className="space-y-4">
      <form action={accion} className="flex flex-wrap items-start gap-2">
        <Entrada
          name="nombre"
          required
          maxLength={40}
          placeholder="Nueva categoría, ej: Cereales"
          className="max-w-xs flex-1"
          aria-label="Nombre de la nueva categoría"
        />
        <BotonAgregar />
      </form>

      {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
      {estado.ok ? <Aviso tipo="ok">{estado.ok}</Aviso> : null}

      {categorias.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay categorías.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <span className="flex-1 text-sm font-semibold text-tinta">
                {c.nombre}
              </span>
              <Etiqueta tono="apagado">
                {c._count.productos}{" "}
                {c._count.productos === 1 ? "producto" : "productos"}
              </Etiqueta>
              <form action={eliminarCategoria}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className={claseBoton("fantasma")}>
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
