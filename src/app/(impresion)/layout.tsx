import type { Metadata } from "next";
import "./impresion.css";

export const metadata: Metadata = {
  title: "Catálogo para imprimir · Don Humberto",
  robots: { index: false, follow: false },
};

/**
 * Raíz aparte, sin Tailwind: ver el comentario de impresion.css.
 */
export default function LayoutImpresion({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
