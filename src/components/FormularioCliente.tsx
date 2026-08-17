"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { crearCliente, actualizarCliente } from "@/acciones/clientes";
import type { EstadoAccion } from "@/acciones/productos";
import {
  Aviso,
  Campo,
  Entrada,
  AreaTexto,
  Casilla,
  Boton,
  EnlaceBoton,
} from "@/components/ui";

export type ClienteFormulario = {
  id: string;
  nombre: string;
  empresa: string | null;
  rut: string | null;
  correo: string | null;
  whatsapp: string | null;
  telefono: string | null;
  direccionDespacho: string | null;
  notas: string | null;
  activo: boolean;
};

function BotonGuardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : nuevo ? "Crear cliente" : "Guardar cambios"}
    </Boton>
  );
}

export function FormularioCliente({
  cliente,
  luegoCotizar,
}: {
  cliente?: ClienteFormulario;
  luegoCotizar?: boolean;
}) {
  const nuevo = !cliente;
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    nuevo ? crearCliente : actualizarCliente,
    {}
  );

  return (
    <form action={accion} className="space-y-5">
      {cliente ? <input type="hidden" name="id" value={cliente.id} /> : null}
      {luegoCotizar ? <input type="hidden" name="luegoCotizar" value="1" /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del contacto" htmlFor="nombre">
          <Entrada
            id="nombre"
            name="nombre"
            required
            maxLength={80}
            defaultValue={cliente?.nombre}
            placeholder="Juan Soto"
          />
        </Campo>

        <Campo etiqueta="Empresa" htmlFor="empresa">
          <Entrada
            id="empresa"
            name="empresa"
            maxLength={120}
            defaultValue={cliente?.empresa ?? ""}
            placeholder="Distribuidora del Sur Ltda"
          />
        </Campo>

        <Campo etiqueta="RUT" htmlFor="rut">
          <Entrada
            id="rut"
            name="rut"
            maxLength={20}
            defaultValue={cliente?.rut ?? ""}
            placeholder="76.123.456-7"
          />
        </Campo>

        <Campo etiqueta="Correo" htmlFor="correo">
          <Entrada
            id="correo"
            name="correo"
            type="email"
            maxLength={120}
            defaultValue={cliente?.correo ?? ""}
            placeholder="compras@empresa.cl"
          />
        </Campo>

        <Campo
          etiqueta="WhatsApp"
          htmlFor="whatsapp"
          ayuda="Con código de país. Se usa para enviarle la cotización."
        >
          <Entrada
            id="whatsapp"
            name="whatsapp"
            maxLength={30}
            defaultValue={cliente?.whatsapp ?? ""}
            placeholder="+56 9 1234 5678"
          />
        </Campo>

        <Campo etiqueta="Teléfono fijo" htmlFor="telefono">
          <Entrada
            id="telefono"
            name="telefono"
            maxLength={30}
            defaultValue={cliente?.telefono ?? ""}
            placeholder="+56 73 123 4567"
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Dirección de despacho"
        htmlFor="direccionDespacho"
        ayuda="Es lo que hace variar el precio que le cotizas."
      >
        <Entrada
          id="direccionDespacho"
          name="direccionDespacho"
          maxLength={200}
          defaultValue={cliente?.direccionDespacho ?? ""}
          placeholder="Av. Principal 123, Talca"
        />
      </Campo>

      <Campo
        etiqueta="Notas internas"
        htmlFor="notas"
        ayuda="Solo las ves tú. No salen en la cotización."
      >
        <AreaTexto
          id="notas"
          name="notas"
          rows={3}
          maxLength={1000}
          defaultValue={cliente?.notas ?? ""}
          placeholder="Compra pallets completos. Paga a 30 días."
        />
      </Campo>

      <Casilla
        nombre="activo"
        etiqueta="Cliente activo"
        defecto={cliente?.activo ?? true}
        descripcion="Los inactivos no aparecen al crear una cotización nueva."
      />

      {estado.error ? <Aviso tipo="error">{estado.error}</Aviso> : null}
      {estado.ok ? <Aviso tipo="ok">{estado.ok}</Aviso> : null}

      <div className="flex flex-wrap items-center gap-3">
        <BotonGuardar nuevo={nuevo} />
        <EnlaceBoton href="/admin/clientes" variante="fantasma">
          Volver al listado
        </EnlaceBoton>
      </div>
    </form>
  );
}
