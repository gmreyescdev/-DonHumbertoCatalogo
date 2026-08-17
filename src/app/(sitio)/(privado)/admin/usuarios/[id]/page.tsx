import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import { fechaHora, fecha } from "@/lib/formato";
import { eliminarUsuario } from "@/acciones/usuarios";
import { Panel, claseBoton } from "@/components/ui";
import { FormularioUsuario } from "@/components/FormularioUsuario";

export const dynamic = "force-dynamic";

export default async function PaginaEditarUsuario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requiereAdmin();
  const { id } = await params;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      empresa: true,
      telefono: true,
      rol: true,
      activo: true,
      creadoEn: true,
      ultimoAcceso: true,
    },
  });

  if (!usuario) notFound();

  const esMiCuenta = usuario.id === admin.id;

  const adminsActivos = await prisma.usuario.count({
    where: { rol: "ADMIN", activo: true },
  });
  const ultimoAdmin = usuario.rol === "ADMIN" && adminsActivos <= 1;

  return (
    <div className="space-y-5">
      <Panel
        titulo={`Cuenta de ${usuario.nombre}`}
        descripcion={`Creada el ${fecha(usuario.creadoEn)} · ${
          usuario.ultimoAcceso
            ? `último acceso ${fechaHora(usuario.ultimoAcceso)}`
            : "nunca ha entrado"
        }`}
      >
        <FormularioUsuario usuario={usuario} esMiCuenta={esMiCuenta} />
      </Panel>

      {!esMiCuenta && !ultimoAdmin ? (
        <Panel
          titulo="Eliminar cuenta"
          descripcion="Pierde el acceso al catálogo de inmediato. Si es algo temporal, mejor desactívala."
        >
          <form action={eliminarUsuario}>
            <input type="hidden" name="id" value={usuario.id} />
            <button type="submit" className={claseBoton("peligro")}>
              Eliminar la cuenta de {usuario.nombre}
            </button>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
