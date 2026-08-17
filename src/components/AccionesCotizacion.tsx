"use client";

import { useEffect, useState } from "react";
import {
  generarPdfDeHojas,
  descargarBlob,
  normalizarWhatsapp,
} from "@/lib/generarPdf";

type Props = {
  numero: number;
  nombreArchivo: string;
  nombreCliente: string;
  whatsappCliente: string | null;
  marca: string;
};

export function AccionesCotizacion({
  numero,
  nombreArchivo,
  nombreCliente,
  whatsappCliente,
  marca,
}: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");
  const [numeroDestino, setNumeroDestino] = useState(whatsappCliente ?? "");
  const [enlace, setEnlace] = useState<string | null>(null);
  const [puedeCompartir, setPuedeCompartir] = useState(false);

  // La API de compartir archivos solo existe en algunos navegadores (sobre todo
  // móviles), así que el botón se muestra únicamente cuando de verdad sirve.
  useEffect(() => {
    try {
      const prueba = new File([new Blob(["x"])], "p.pdf", {
        type: "application/pdf",
      });
      setPuedeCompartir(
        typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [prueba] })
      );
    } catch {
      setPuedeCompartir(false);
    }
  }, []);

  async function construirPdf(): Promise<Blob> {
    return generarPdfDeHojas((hoja, total) =>
      setEstado(`Generando… hoja ${hoja} de ${total}`)
    );
  }

  async function descargar() {
    setOcupado(true);
    setError("");
    try {
      const blob = await construirPdf();
      descargarBlob(blob, nombreArchivo);
      setEstado("PDF descargado");
    } catch (e) {
      console.error(e);
      setError("No se pudo generar el PDF. Prueba con «Imprimir».");
      setEstado("");
    } finally {
      setOcupado(false);
    }
  }

  async function subirYObtenerEnlace(destino: string | null): Promise<string> {
    const blob = await construirPdf();
    setEstado("Guardando el enlace…");

    const cuerpo = new FormData();
    cuerpo.append(
      "archivo",
      new File([blob], nombreArchivo, { type: "application/pdf" })
    );
    cuerpo.append("cotizacion", String(numero));
    cuerpo.append("nombreArchivo", nombreArchivo);
    if (destino) cuerpo.append("enviadoA", destino);

    const respuesta = await fetch("/api/pdf-compartido", {
      method: "POST",
      body: cuerpo,
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => null);
      throw new Error(detalle?.error ?? "No se pudo guardar el PDF.");
    }

    const { url } = (await respuesta.json()) as { url: string };
    return url;
  }

  async function enviarPorWhatsapp() {
    const destino = normalizarWhatsapp(numeroDestino);
    if (!destino) {
      setError(
        "Revisa el número. Escríbelo con código de país, por ejemplo +56 9 1234 5678."
      );
      return;
    }

    setOcupado(true);
    setError("");

    try {
      const url = await subirYObtenerEnlace(destino);
      setEnlace(url);

      const mensaje =
        `Hola ${nombreCliente}, aquí va tu cotización N° ${numero} de ${marca}:\n${url}\n\n` +
        `El enlace estará disponible por 90 días. Cualquier duda, nos escribes.`;

      window.open(
        `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`,
        "_blank",
        "noopener,noreferrer"
      );

      setEstado("WhatsApp abierto con el mensaje listo");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "No se pudo preparar el envío.");
      setEstado("");
    } finally {
      setOcupado(false);
    }
  }

  async function compartirArchivo() {
    setOcupado(true);
    setError("");
    try {
      const blob = await construirPdf();
      const archivo = new File([blob], nombreArchivo, {
        type: "application/pdf",
      });
      await navigator.share({
        files: [archivo],
        title: `Cotización N° ${numero}`,
        text: `Cotización N° ${numero} de ${marca}`,
      });
      setEstado("Compartido");
    } catch (e) {
      // Si la persona cierra el menú de compartir no es un error que mostrar.
      if ((e as Error)?.name !== "AbortError") {
        console.error(e);
        setError("No se pudo compartir el archivo.");
      }
      setEstado("");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="acciones">
      <div className="acciones-fila">
        <button
          type="button"
          className="btn btn-primario"
          onClick={descargar}
          disabled={ocupado}
        >
          {ocupado ? "Trabajando…" : "Descargar PDF"}
        </button>

        <button
          type="button"
          className="btn btn-suave"
          onClick={() => window.print()}
          disabled={ocupado}
        >
          Imprimir
        </button>

        {puedeCompartir ? (
          <button
            type="button"
            className="btn btn-suave"
            onClick={compartirArchivo}
            disabled={ocupado}
          >
            Compartir PDF
          </button>
        ) : null}
      </div>

      <div className="acciones-fila envio">
        <label htmlFor="destino" className="etiqueta-envio">
          Enviar por WhatsApp al
        </label>
        <input
          id="destino"
          type="tel"
          value={numeroDestino}
          onChange={(e) => setNumeroDestino(e.target.value)}
          placeholder="+56 9 1234 5678"
          className="campo-telefono"
          disabled={ocupado}
        />
        <button
          type="button"
          className="btn btn-whatsapp"
          onClick={enviarPorWhatsapp}
          disabled={ocupado || numeroDestino.trim() === ""}
        >
          Enviar por WhatsApp
        </button>
      </div>

      {estado ? (
        <p className="estado" role="status">
          {estado}
        </p>
      ) : null}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {enlace ? (
        <p className="enlace-generado">
          Enlace del PDF:{" "}
          <a href={enlace} target="_blank" rel="noreferrer noopener">
            {enlace}
          </a>
          <button
            type="button"
            className="btn-copiar"
            onClick={() => {
              navigator.clipboard?.writeText(enlace);
              setEstado("Enlace copiado");
            }}
          >
            Copiar
          </button>
        </p>
      ) : null}
    </div>
  );
}
