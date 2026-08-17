"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cambiarMiClave, type EstadoFormulario } from "@/acciones/auth";
import { Aviso, Campo, Entrada, Boton } from "@/components/ui";

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Cambiar contraseña"}
    </Boton>
  );
}

export function FormularioClave() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(
    cambiarMiClave,
    {}
  );

  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta="Contraseña actual" htmlFor="actual">
        <Entrada
          id="actual"
          name="actual"
          type="password"
          autoComplete="current-password"
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Contraseña nueva" htmlFor="nueva">
          <Entrada
            id="nueva"
            name="nueva"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Campo>

        <Campo etiqueta="Repite la nueva" htmlFor="repetir">
          <Entrada
            id="repetir"
            name="repetir"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Campo>
      </div>

      {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
      {estado.ok ? <Aviso tipo="ok">{estado.ok}</Aviso> : null}

      <BotonGuardar />
    </form>
  );
}
