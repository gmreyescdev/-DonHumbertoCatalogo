"use client";

import { useState } from "react";
import { generarPdfDeHojas, descargarBlob } from "@/lib/generarPdf";

export function BotonDescargarPdf({ nombreArchivo }: { nombreArchivo: string }) {
  const [generando, setGenerando] = useState(false);
  const [estado, setEstado] = useState("");

  async function descargar() {
    setGenerando(true);
    setEstado("Generando…");

    try {
      const blob = await generarPdfDeHojas((hoja, total) =>
        setEstado(`Generando… hoja ${hoja} de ${total}`)
      );
      descargarBlob(blob, nombreArchivo);
      setEstado("PDF descargado");
    } catch (error) {
      console.error(error);
      setEstado("No se pudo generar el PDF. Prueba con «Imprimir».");
    } finally {
      setGenerando(false);
      setTimeout(() => setEstado(""), 6000);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primario"
        onClick={descargar}
        disabled={generando}
      >
        {generando ? "Generando…" : "Descargar PDF"}
      </button>

      <button
        type="button"
        className="btn btn-suave"
        onClick={() => window.print()}
      >
        Imprimir
      </button>

      <span className="estado" role="status">
        {estado}
      </span>
    </>
  );
}
