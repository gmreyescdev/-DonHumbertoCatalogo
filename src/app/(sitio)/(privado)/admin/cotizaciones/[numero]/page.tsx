import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fechaHora } from "@/lib/formato";
import { sugerenciasPara } from "@/lib/sugerencias";
import { eliminarCotizacion } from "@/acciones/cotizaciones";
import { Panel, Aviso, Etiqueta, claseBoton } from "@/components/ui";
import { EditorCotizacion } from "@/components/EditorCotizacion";
import { ETIQUETA_ESTADO, TONO_ESTADO } from "@/components/estadoCotizacion";

export const dynamic = "force-dynamic";

export default async function PaginaEditarCotizacion({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { numero: numeroCrudo } = await params;
  const { ok } = await searchParams;

  const numero = Number.parseInt(numeroCrudo, 10);
  if (!Number.isFinite(numero)) notFound();

  const [cotizacion, clientes, productos] = await Promise.all([
    prisma.cotizacion.findUnique({
      where: { numero },
      select: {
        numero: true,
        clienteId: true,
        estado: true,
        validezDias: true,
        ivaPorcentaje: true,
        condicionDespacho: true,
        notas: true,
        creadoEn: true,
        actualizadoEn: true,
        autor: { select: { nombre: true } },
        cliente: { select: { nombre: true, empresa: true } },
        lineas: {
          orderBy: { orden: "asc" },
          select: { productoId: true, cantidadKg: true, precioNeto: true },
        },
      },
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, empresa: true },
    }),
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        formato: true,
        color: true,
        precioNeto: true,
      },
    }),
  ]);

  if (!cotizacion) notFound();

  // Al editar no se proponen precios de otra cotización: mandan los suyos.
  const sugerencias = await sugerenciasPara(cotizacion.clienteId, numero);

  const { cliente, autor, creadoEn, actualizadoEn, ...editable } = cotizacion;

  return (
    <div className="space-y-5">
      {ok === "creada" ? (
        <Aviso tipo="ok">
          Cotización creada. Ya puedes generar su PDF y enviarla por WhatsApp.
        </Aviso>
      ) : null}

      <Panel
        titulo={`Cotización N° ${cotizacion.numero}`}
        descripcion={`${cliente.nombre}${cliente.empresa ? ` — ${cliente.empresa}` : ""} · creada el ${fechaHora(creadoEn)}${autor ? ` por ${autor.nombre}` : ""}`}
        acciones={
          <Etiqueta tono={TONO_ESTADO[cotizacion.estado]}>
            {ETIQUETA_ESTADO[cotizacion.estado]}
          </Etiqueta>
        }
      >
        <EditorCotizacion
          clientes={clientes}
          productos={productos}
          cotizacion={editable}
          sugerencias={sugerencias}
          condicionPorDefecto=""
        />
      </Panel>

      <Panel
        titulo="Eliminar cotización"
        descripcion={`Última modificación: ${fechaHora(actualizadoEn)}. Se borran también los enlaces de PDF que hayas generado.`}
      >
        <form action={eliminarCotizacion}>
          <input type="hidden" name="numero" value={cotizacion.numero} />
          <button type="submit" className={claseBoton("peligro")}>
            Eliminar la cotización N° {cotizacion.numero}
          </button>
        </form>
      </Panel>
    </div>
  );
}
