import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth";
import { miles, pesos, fecha } from "@/lib/formato";
import {
  totalesDeCotizacion,
  subtotalDeLinea,
  vigenteHasta,
} from "@/lib/cotizacion";
import { AccionesCotizacion } from "@/components/AccionesCotizacion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  return {
    title: `Cotización N° ${numero}`,
    robots: { index: false, follow: false },
  };
}

/** Líneas que caben en la primera hoja (lleva encabezado y destinatario). */
const LINEAS_PRIMERA_HOJA = 11;
/** Líneas por hoja de continuación. */
const LINEAS_POR_HOJA = 18;

function repartirLineas<T>(lineas: T[]): T[][] {
  if (lineas.length <= LINEAS_PRIMERA_HOJA) return [lineas];

  const hojas: T[][] = [lineas.slice(0, LINEAS_PRIMERA_HOJA)];
  for (let i = LINEAS_PRIMERA_HOJA; i < lineas.length; i += LINEAS_POR_HOJA) {
    hojas.push(lineas.slice(i, i + LINEAS_POR_HOJA));
  }
  return hojas;
}

async function logoDataUri(imagenId: string | null): Promise<string | null> {
  if (!imagenId) return null;
  const imagen = await prisma.imagen.findUnique({
    where: { id: imagenId },
    select: { datos: true, mimeType: true },
  });
  if (!imagen) return null;
  return `data:${imagen.mimeType};base64,${Buffer.from(imagen.datos).toString("base64")}`;
}

export default async function PaginaCotizacionPdf({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero: numeroCrudo } = await params;
  const numero = Number.parseInt(numeroCrudo, 10);
  if (!Number.isFinite(numero)) notFound();

  await requiereAdmin(`/cotizacion/${numero}`);

  const [cotizacion, ajustes] = await Promise.all([
    prisma.cotizacion.findUnique({
      where: { numero },
      select: {
        numero: true,
        estado: true,
        creadoEn: true,
        validezDias: true,
        ivaPorcentaje: true,
        condicionDespacho: true,
        notas: true,
        cliente: {
          select: {
            nombre: true,
            empresa: true,
            rut: true,
            correo: true,
            whatsapp: true,
            direccionDespacho: true,
          },
        },
        lineas: {
          orderBy: { orden: "asc" },
          select: {
            id: true,
            nombre: true,
            formato: true,
            cantidadKg: true,
            precioNeto: true,
          },
        },
      },
    }),
    prisma.ajustes.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!cotizacion) notFound();

  const logo = await logoDataUri(ajustes?.logoId ?? null);
  const marca = ajustes?.nombreMarca ?? "Don Humberto";
  const totales = totalesDeCotizacion(cotizacion.lineas, cotizacion.ivaPorcentaje);
  const hojas = repartirLineas(cotizacion.lineas);
  const vence = vigenteHasta(cotizacion.creadoEn, cotizacion.validezDias);

  const nombreArchivo = `Cotizacion_${cotizacion.numero}_${cotizacion.cliente.nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .slice(0, 40)}.pdf`;

  return (
    <>
      <div className="barra">
        <h1>
          Cotización N° {cotizacion.numero} — {cotizacion.cliente.nombre}
        </h1>
        <Link href={`/admin/cotizaciones/${cotizacion.numero}`} className="btn btn-suave">
          Editar
        </Link>
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "16px 12px 0" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,.06)",
          }}
        >
          <AccionesCotizacion
            numero={cotizacion.numero}
            nombreArchivo={nombreArchivo}
            nombreCliente={cotizacion.cliente.nombre.split(" ")[0]}
            whatsappCliente={cotizacion.cliente.whatsapp}
            marca={marca}
          />
        </div>
      </div>

      <p className="pista">
        El botón <b>Enviar por WhatsApp</b> guarda este PDF, crea un enlace privado
        y abre WhatsApp con el mensaje ya escrito para ese número. WhatsApp no
        permite adjuntar archivos desde un enlace web, así que tu cliente recibe el
        enlace y lo abre con un toque. Desde el celular, <b>Compartir PDF</b> sí
        adjunta el archivo directamente.
      </p>

      <div className="hojas">
        {hojas.map((grupo, indice) => {
          const esUltima = indice === hojas.length - 1;
          return (
            <div className="hoja cot" key={indice}>
              {/* --------------------------- Encabezado --------------------------- */}
              <div className="encabezado">
                <div>
                  <div className="marca">{marca}</div>
                  <div className="razon">
                    {ajustes?.razonSocial ?? ""}
                    <br />
                    {ajustes?.rut ? `RUT ${ajustes.rut}` : ""}
                    <br />
                    {ajustes?.direccion ?? ""}
                  </div>
                </div>

                {logo ? (
                  <div className="logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="" />
                  </div>
                ) : null}

                <div className="folio">
                  <div className="rotulo">Cotización</div>
                  <div className="numero">
                    N° {cotizacion.numero}
                    {hojas.length > 1 ? (
                      <span style={{ fontSize: 15 }}>
                        {" "}
                        ({indice + 1}/{hojas.length})
                      </span>
                    ) : null}
                  </div>
                  <div className="fechas">
                    Emitida: {fecha(cotizacion.creadoEn)}
                    <br />
                    Válida hasta: {fecha(vence)}
                  </div>
                </div>
              </div>

              {/* -------------------------- Destinatario -------------------------- */}
              {indice === 0 ? (
                <div className="destinatario">
                  <div>
                    <div className="rotulo">Cliente</div>
                    <div className="valor">
                      {cotizacion.cliente.empresa ?? cotizacion.cliente.nombre}
                    </div>
                  </div>
                  <div>
                    <div className="rotulo">Contacto</div>
                    <div className="valor">
                      {cotizacion.cliente.nombre}
                      {cotizacion.cliente.correo
                        ? ` · ${cotizacion.cliente.correo}`
                        : ""}
                    </div>
                  </div>
                  <div>
                    <div className="rotulo">RUT</div>
                    <div className="valor">{cotizacion.cliente.rut ?? "—"}</div>
                  </div>
                  <div>
                    <div className="rotulo">Despacho</div>
                    <div className="valor">
                      {cotizacion.condicionDespacho ??
                        cotizacion.cliente.direccionDespacho ??
                        "Por confirmar"}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ----------------------------- Tabla ------------------------------ */}
              <div className="cuerpo">
                <table className="tabla-cot">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio por kg</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <div className="producto">{l.nombre}</div>
                          <div className="detalle">{l.formato}</div>
                        </td>
                        <td>{miles(l.cantidadKg)} kg</td>
                        <td>{pesos(l.precioNeto)}</td>
                        <td style={{ fontWeight: 700 }}>
                          {pesos(subtotalDeLinea(l))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {esUltima ? (
                  <>
                    <div className="totales">
                      <table>
                        <tbody>
                          <tr>
                            <td>Kilos totales</td>
                            <td>{miles(totales.kilos)} kg</td>
                          </tr>
                          <tr>
                            <td>Neto</td>
                            <td style={{ fontWeight: 700 }}>
                              {pesos(totales.neto)}
                            </td>
                          </tr>
                          <tr>
                            <td>IVA {cotizacion.ivaPorcentaje}%</td>
                            <td>{pesos(totales.iva)}</td>
                          </tr>
                          <tr className="granTotal">
                            <td>TOTAL</td>
                            <td>{pesos(totales.total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="observaciones">
                      <div className="rotulo">Condiciones</div>
                      {cotizacion.condicionDespacho ? (
                        <div>
                          <b>Despacho:</b> {cotizacion.condicionDespacho}
                        </div>
                      ) : null}
                      <div>
                        <b>Validez:</b> esta cotización rige hasta el{" "}
                        {fecha(vence)}. Pasada esa fecha, los precios deben
                        reconfirmarse.
                      </div>
                      <div>
                        <b>Precios:</b> en pesos chilenos por kilo, netos. El IVA
                        se detalla por separado.
                      </div>
                      {cotizacion.notas ? <div>{cotizacion.notas}</div> : null}
                    </div>
                  </>
                ) : null}
              </div>

              {/* ------------------------------ Pie ------------------------------- */}
              <div className="pie">
                <div className="datos">
                  <div>
                    <div className="rotulo">Razón social</div>
                    <div className="valor">{ajustes?.razonSocial ?? "—"}</div>
                  </div>
                  <div>
                    <div className="rotulo">Correo</div>
                    <div className="valor">{ajustes?.correo ?? "—"}</div>
                  </div>
                  <div>
                    <div className="rotulo">WhatsApp</div>
                    <div className="valor">{ajustes?.whatsapp ?? "—"}</div>
                  </div>
                </div>
                <div className="gracias">
                  Gracias por preferir <span>{marca}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
