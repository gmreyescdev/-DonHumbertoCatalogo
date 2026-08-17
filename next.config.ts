import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de producto se suben dentro de un Server Action. El tope real
      // en Vercel es ~4,5 MB por petición, así que validamos en 4 MB y aquí
      // dejamos algo de margen para el resto del formulario.
      bodySizeLimit: "5mb",
    },
  },
  // sharp comprime las fotos antes de guardarlas; no debe empaquetarse.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
