import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requiereUsuario } from "@/lib/auth";
import { miles } from "@/lib/formato";
import { BotonDescargarPdf } from "@/components/BotonDescargarPdf";

export const dynamic = "force-dynamic";

/** Filas de producto que caben cómodas en una hoja A4. */
const FILAS_POR_HOJA = 7;

function trozos<T>(lista: T[], tamano: number): T[][] {
  const salida: T[][] = [];
  for (let i = 0; i < lista.length; i += tamano) {
    salida.push(lista.slice(i, i + tamano));
  }
  return salida.length > 0 ? salida : [[]];
}

/**
 * Las fotos se incrustan como data URI en vez de enlazarse.
 * html2canvas no puede rasterizar una imagen que aún no cargó ni una protegida
 * por cookie de sesión, así que va todo dentro del HTML desde el servidor.
 */
async function comoDataUri(imagenId: string | null): Promise<string | null> {
  if (!imagenId) return null;

  const imagen = await prisma.imagen.findUnique({
    where: { id: imagenId },
    select: { datos: true, mimeType: true },
  });
  if (!imagen) return null;

  const base64 = Buffer.from(imagen.datos).toString("base64");
  return `data:${imagen.mimeType};base64,${base64}`;
}

export default async function PaginaPdf() {
  await requiereUsuario("/pdf");

  const [productos, ajustes] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: [{ destacado: "desc" }, { orden: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        formato: true,
        color: true,
        precioNeto: true,
        precioFirme: true,
        imagenId: true,
      },
    }),
    prisma.ajustes.findUnique({ where: { id: "singleton" } }),
  ]);

  // Se resuelven todas las fotos en paralelo antes de pintar.
  const fotos = new Map<string, string>();
  const idsUnicos = [
    ...new Set(productos.map((p) => p.imagenId).filter((x): x is string => !!x)),
  ];
  await Promise.all(
    idsUnicos.map(async (id) => {
      const uri = await comoDataUri(id);
      if (uri) fotos.set(id, uri);
    })
  );

  const logo = await comoDataUri(ajustes?.logoId ?? null);

  const marca = ajustes?.nombreMarca ?? "Don Humberto";
  const paginas = trozos(productos, FILAS_POR_HOJA);

  const portada = productos
    .map((p) => (p.imagenId ? fotos.get(p.imagenId) : null))
    .filter((x): x is string => !!x)
    .slice(0, 3);

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="barra">
        <h1>Catálogo listo para enviar — {marca}</h1>
        <BotonDescargarPdf
          nombreArchivo={`Catalogo_${marca.replace(/\s+/g, "_")}_${hoy}.pdf`}
        />
        <Link href="/" className="btn btn-suave">
          Volver al catálogo
        </Link>
      </div>

      <p className="pista">
        Estas son las {paginas.length + 2} hojas del catálogo, con los precios que
        tienes cargados ahora. Aprieta <b>Descargar PDF</b> y comparte el archivo
        por WhatsApp o correo. Para cambiar precios o productos, vuelve al panel de
        administración.
      </p>

      <div className="hojas">
        {/* ------------------------------ Portada ------------------------------ */}
        <div className="hoja portada">
          {logo ? (
            <div className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" />
            </div>
          ) : null}

          <div className="antetitulo">
            {ajustes?.razonSocial ?? "Comercializadora Valle del Maule"}
          </div>

          <div className="marca">
            {marca.split(" ").map((palabra, i) => (
              <span key={`${palabra}-${i}`} style={{ display: "block" }}>
                {palabra}
              </span>
            ))}
          </div>

          <div className="eslogan">
            {ajustes?.eslogan ?? "Legumbres premium · desde 1999"}
          </div>

          <div className="regla" />

          <div className="titulo">
            {ajustes?.titulo ?? "Catálogo Mayorista de Legumbres a Granel"}
          </div>

          <div className="region">
            {ajustes?.region ?? "Región del Maule · Longaví · Chile"}
            <br />
            Calidad premium — Alimento sano y natural
          </div>

          <div className="fotos">
            {portada.map((uri, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={uri} alt="" />
            ))}
          </div>
        </div>

        {/* ----------------------------- Productos ----------------------------- */}
        {paginas.map((grupo, indice) => (
          <div className="hoja" key={indice}>
            <div className="cabecera">
              <div className="antetitulo">Lista de precios mayorista</div>
              <h2>
                Nuestros Productos
                {paginas.length > 1 ? ` (${indice + 1}/${paginas.length})` : ""}
              </h2>
            </div>

            <div className="lista">
              {grupo.length === 0 ? (
                <p className="nota">No hay productos publicados.</p>
              ) : (
                grupo.map((p) => {
                  const foto = p.imagenId ? fotos.get(p.imagenId) : null;
                  return (
                    <div className="fila" key={p.id}>
                      <span
                        className="franja"
                        style={{ backgroundColor: p.color }}
                      />
                      {foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="foto" src={foto} alt="" />
                      ) : (
                        <span className="sinfoto" />
                      )}

                      <div className="datos">
                        <div className="nombre">{p.nombre}</div>
                        <div className="formato">{p.formato}</div>
                      </div>

                      <div className="precios">
                        <div className="caja">
                          <div className="rotulo">Neto +IVA</div>
                          <div className="valor">
                            <span className="signo">$</span>
                            {miles(p.precioNeto)}
                          </div>
                          <div className="kilo">por kg</div>
                        </div>
                        <div className="caja firme">
                          <div className="rotulo">Compra firme</div>
                          <div className="valor">
                            <span className="signo">$</span>
                            {miles(p.precioFirme)}
                          </div>
                          <div className="kilo">por kg</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {indice === paginas.length - 1 ? (
                <div className="nota">
                  Precios en CLP por kilo. Valores referenciales sujetos a
                  confirmación al momento de cotizar.
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {/* ----------------------------- Contacto ------------------------------ */}
        <div className="hoja contacto">
          <div className="arriba">
            <div className="antetitulo">Condiciones comerciales</div>
            <h2>Cómo comprar</h2>
            <div className="condiciones">
              {(ajustes?.condiciones ?? "")
                .split("\n")
                .filter((linea) => linea.trim())
                .map((linea) => {
                  const corte = linea.indexOf(":");
                  const titulo = corte > 0 ? linea.slice(0, corte + 1) : null;
                  const cuerpo = corte > 0 ? linea.slice(corte + 1) : linea;
                  return (
                    <div key={linea}>
                      {titulo ? <b>{titulo}</b> : null}
                      {cuerpo}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="abajo">
            <div className="llamado">
              Solicita tu <span>cotización</span> hoy
            </div>

            <div className="datos-empresa">
              <div>
                <div className="rotulo">Razón Social</div>
                <div className="valor">{ajustes?.razonSocial ?? "—"}</div>
              </div>
              <div>
                <div className="rotulo">RUT</div>
                <div className="valor">{ajustes?.rut ?? "—"}</div>
              </div>
              <div>
                <div className="rotulo">Dirección</div>
                <div className="valor">{ajustes?.direccion ?? "—"}</div>
              </div>
              <div>
                <div className="rotulo">Correo</div>
                <div className="valor">{ajustes?.correo ?? "—"}</div>
              </div>
            </div>

            <div className="whatsapp">WhatsApp {ajustes?.whatsapp ?? ""}</div>
          </div>
        </div>
      </div>
    </>
  );
}
