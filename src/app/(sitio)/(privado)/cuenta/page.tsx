import type { Metadata } from "next";
import { requiereUsuario } from "@/lib/auth";
import { Panel } from "@/components/ui";
import { FormularioClave } from "@/components/FormularioClave";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function PaginaCuenta() {
  const usuario = await requiereUsuario("/cuenta");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-bold text-azul-900">
        Mi cuenta
      </h1>

      <div className="space-y-5">
        <Panel titulo="Tus datos">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato etiqueta="Nombre" valor={usuario.nombre} />
            <Dato etiqueta="Correo" valor={usuario.email} />
            <Dato etiqueta="Empresa" valor={usuario.empresa ?? "—"} />
            <Dato
              etiqueta="Tipo de cuenta"
              valor={usuario.rol === "ADMIN" ? "Administrador" : "Cliente"}
            />
          </dl>
          <p className="mt-5 text-sm text-slate-500">
            ¿Necesitas corregir algún dato? Escríbenos y lo actualizamos.
          </p>
        </Panel>

        <Panel
          titulo="Cambiar contraseña"
          descripcion="Usa al menos 8 caracteres."
        >
          <FormularioClave />
        </Panel>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 text-[15px] text-tinta">{valor}</dd>
    </div>
  );
}
