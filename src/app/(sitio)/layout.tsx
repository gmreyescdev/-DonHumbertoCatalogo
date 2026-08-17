import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "../globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--fuente-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--fuente-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Catálogo Don Humberto",
    template: "%s · Don Humberto",
  },
  description:
    "Catálogo mayorista de legumbres a granel. Comercializadora Valle del Maule Ltda, Longaví, Región del Maule.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#153a7a",
};

export default function LayoutSitio({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
