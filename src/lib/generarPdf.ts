/**
 * Convierte las hojas `.hoja` de la página en un PDF A4.
 *
 * Corre solo en el navegador: html2canvas necesita un DOM real. Las librerías
 * se importan al llamar la función para que no pesen en la carga inicial.
 */
export async function generarPdfDeHojas(
  alProgresar?: (hoja: number, total: number) => void
): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const hojas = Array.from(document.querySelectorAll<HTMLElement>(".hoja"));
  if (hojas.length === 0) {
    throw new Error("No hay hojas que exportar.");
  }

  const pdf = new jsPDF("p", "mm", "a4");

  for (let i = 0; i < hojas.length; i++) {
    alProgresar?.(i + 1, hojas.length);

    // Sin `windowWidth`: la hoja ya mide 794 × 1123 px fijos y se captura tal
    // cual. Forzar un ancho de ventana recalcularía el diseño.
    const lienzo = await html2canvas(hojas[i], {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const imagen = lienzo.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage();
    pdf.addImage(imagen, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  }

  return pdf.output("blob");
}

/** Dispara la descarga del PDF en el navegador. */
export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera después para no cortar la descarga en curso.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Normaliza un número chileno al formato que espera wa.me (solo dígitos, con
 * código de país). Devuelve null si no parece un número utilizable.
 */
export function normalizarWhatsapp(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, "");

  // 00 56 9 ... → 56 9 ...
  if (digitos.startsWith("00")) digitos = digitos.slice(2);

  // 9 1234 5678 (celular chileno sin código de país) → 56 9 1234 5678
  if (digitos.length === 9 && digitos.startsWith("9")) {
    digitos = `56${digitos}`;
  }

  // 0 9 1234 5678 → 56 9 1234 5678
  if (digitos.length === 10 && digitos.startsWith("09")) {
    digitos = `56${digitos.slice(1)}`;
  }

  if (digitos.length < 10 || digitos.length > 15) return null;

  return digitos;
}
