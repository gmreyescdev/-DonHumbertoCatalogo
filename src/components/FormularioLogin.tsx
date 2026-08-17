"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { iniciarSesion, type EstadoFormulario } from "@/acciones/auth";

function BotonEntrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-xl bg-azul-800 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-azul-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function FormularioLogin({ volver }: { volver?: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(
    iniciarSesion,
    {}
  );

  return (
    <form action={accion} className="space-y-4">
      {volver ? <input type="hidden" name="volver" value={volver} /> : null}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="tucorreo@empresa.cl"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-tinta placeholder:text-slate-400 focus:border-azul-700 focus:ring-0"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-tinta placeholder:text-slate-400 focus:border-azul-700 focus:ring-0"
        />
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-xl border border-rojo-600/25 bg-rojo-100 px-4 py-3 text-sm font-medium text-rojo-700"
        >
          {estado.error}
        </p>
      ) : null}

      <BotonEntrar />
    </form>
  );
}
