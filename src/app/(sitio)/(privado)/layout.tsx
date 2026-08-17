import { requiereUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EncabezadoSitio } from "@/components/EncabezadoSitio";
import { PieSitio } from "@/components/PieSitio";

export default async function LayoutPrivado({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await requiereUsuario();

  const ajustes = await prisma.ajustes.findUnique({
    where: { id: "singleton" },
    select: {
      nombreMarca: true,
      razonSocial: true,
      rut: true,
      direccion: true,
      correo: true,
      whatsapp: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <EncabezadoSitio
        usuario={usuario}
        marca={ajustes?.nombreMarca ?? "Don Humberto"}
      />
      <div className="flex-1">{children}</div>
      <PieSitio ajustes={ajustes} />
    </div>
  );
}
