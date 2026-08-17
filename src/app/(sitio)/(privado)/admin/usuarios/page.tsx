import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import { fechaHora } from "@/lib/formato";
import { alternarUsuarioActivo } from "@/acciones/usuarios";
import { Panel, Etiqueta, claseBoton, EnlaceBoton } from "@/components/ui";
import { FormularioUsuario } from "@/components/FormularioUsuario";

export const dynamic = "force-dynamic";

export default async function PaginaUsuarios() {
  const admin = await requiereAdmin();

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      email: true,
      empresa: true,
      telefono: true,
      rol: true,
      activo: true,
      ultimoAcceso: true,
      creadoEn: true,
    },
  });

  return (
    <div className="space-y-5">
      <Panel
        titulo="Agregar a alguien del equipo"
        descripcion="Estas son las cuentas con las que se entra a administrar. Los clientes no entran a la página: se les envían cotizaciones."
      >
        <FormularioUsuario />
      </Panel>

      <Panel
        titulo="Cuentas del equipo"
        descripcion={`${usuarios.length} ${usuarios.length === 1 ? "cuenta" : "cuentas"} en total.`}
      >
        <ul className="divide-y divide-slate-100">
          {usuarios.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-4 py-4 first:pt-0"
            >
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="font-semibold text-tinta hover:text-azul-700 hover:underline"
                  >
                    {u.nombre}
                  </Link>
                  {u.rol === "ADMIN" ? (
                    <Etiqueta tono="azul">Administrador</Etiqueta>
                  ) : null}
                  {!u.activo ? (
                    <Etiqueta tono="apagado">Desactivada</Etiqueta>
                  ) : null}
                  {u.id === admin.id ? (
                    <Etiqueta tono="dorado">Tú</Etiqueta>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{u.email}</p>
                {u.empresa ? (
                  <p className="text-xs text-slate-500">{u.empresa}</p>
                ) : null}
              </div>

              <p className="text-xs text-slate-500">
                {u.ultimoAcceso
                  ? `Último acceso: ${fechaHora(u.ultimoAcceso)}`
                  : "Nunca ha entrado"}
              </p>

              <div className="flex items-center gap-2">
                {u.id !== admin.id ? (
                  <form action={alternarUsuarioActivo}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className={claseBoton("secundario")}>
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                ) : null}
                <EnlaceBoton href={`/admin/usuarios/${u.id}`} variante="fantasma">
                  Editar
                </EnlaceBoton>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
