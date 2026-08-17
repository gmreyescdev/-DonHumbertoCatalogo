"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { crearUsuario, actualizarUsuario } from "@/acciones/usuarios";
import type { EstadoAccion } from "@/acciones/productos";
import {
  Aviso,
  Campo,
  Entrada,
  Selector,
  Boton,
  EnlaceBoton,
} from "@/components/ui";

export type UsuarioFormulario = {
  id: string;
  email: string;
  nombre: string;
  empresa: string | null;
  telefono: string | null;
  rol: "ADMIN" | "CLIENTE";
};

function BotonGuardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : nuevo ? "Crear cuenta" : "Guardar cambios"}
    </Boton>
  );
}

export function FormularioUsuario({
  usuario,
  esMiCuenta,
}: {
  usuario?: UsuarioFormulario;
  esMiCuenta?: boolean;
}) {
  const nuevo = !usuario;
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    nuevo ? crearUsuario : actualizarUsuario,
    {}
  );

  return (
    <form action={accion} className="space-y-5">
      {usuario ? <input type="hidden" name="id" value={usuario.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del contacto" htmlFor="nombre">
          <Entrada
            id="nombre"
            name="nombre"
            required
            maxLength={80}
            defaultValue={usuario?.nombre}
            placeholder="María Pérez"
          />
        </Campo>

        <Campo etiqueta="Correo (con este entra)" htmlFor="email">
          <Entrada
            id="email"
            name="email"
            type="email"
            required
            defaultValue={usuario?.email}
            placeholder="compras@distribuidora.cl"
          />
        </Campo>

        <Campo etiqueta="Empresa (opcional)" htmlFor="empresa">
          <Entrada
            id="empresa"
            name="empresa"
            maxLength={120}
            defaultValue={usuario?.empresa ?? ""}
            placeholder="Distribuidora del Sur Ltda"
          />
        </Campo>

        <Campo etiqueta="Teléfono (opcional)" htmlFor="telefono">
          <Entrada
            id="telefono"
            name="telefono"
            maxLength={40}
            defaultValue={usuario?.telefono ?? ""}
            placeholder="+56 9 1234 5678"
          />
        </Campo>

        <Campo
          etiqueta="Tipo de cuenta"
          htmlFor="rol"
          ayuda={
            esMiCuenta
              ? "No puedes quitarte a ti mismo el rol de administrador."
              : "El acceso de clientes está cerrado: una cuenta marcada como Cliente no podrá entrar."
          }
        >
          <Selector
            id="rol"
            name="rol"
            defaultValue={usuario?.rol ?? "ADMIN"}
            disabled={esMiCuenta}
          >
            <option value="ADMIN">Administrador</option>
            <option value="CLIENTE">Cliente (acceso cerrado)</option>
          </Selector>
          {esMiCuenta ? (
            <input type="hidden" name="rol" value={usuario?.rol ?? "ADMIN"} />
          ) : null}
        </Campo>

        <Campo
          etiqueta={nuevo ? "Contraseña inicial" : "Nueva contraseña"}
          htmlFor="password"
          ayuda={
            nuevo
              ? "Mínimo 8 caracteres. Entrégasela al cliente."
              : "Déjala en blanco para no cambiarla."
          }
        >
          <Entrada
            id="password"
            name="password"
            type="text"
            autoComplete="new-password"
            required={nuevo}
            minLength={nuevo ? 8 : undefined}
            placeholder={nuevo ? "al menos 8 caracteres" : "sin cambios"}
          />
        </Campo>
      </div>

      {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
      {estado.ok ? <Aviso tipo="ok">{estado.ok}</Aviso> : null}

      <div className="flex flex-wrap items-center gap-3">
        <BotonGuardar nuevo={nuevo} />
        {!nuevo ? (
          <EnlaceBoton href="/admin/usuarios" variante="fantasma">
            Volver al listado
          </EnlaceBoton>
        ) : null}
      </div>
    </form>
  );
}
