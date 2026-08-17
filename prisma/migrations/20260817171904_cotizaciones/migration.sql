-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "rut" TEXT,
    "correo" TEXT,
    "whatsapp" TEXT,
    "telefono" TEXT,
    "direccionDespacho" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "numero" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'BORRADOR',
    "validezDias" INTEGER NOT NULL DEFAULT 15,
    "ivaPorcentaje" INTEGER NOT NULL DEFAULT 19,
    "condicionDespacho" TEXT,
    "notas" TEXT,
    "autorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("numero")
);

-- CreateTable
CREATE TABLE "lineas_cotizacion" (
    "id" TEXT NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "productoId" TEXT,
    "nombre" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "cantidadKg" INTEGER NOT NULL,
    "precioNeto" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lineas_cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdfs_compartidos" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "datos" BYTEA NOT NULL,
    "bytes" INTEGER NOT NULL,
    "cotizacionId" INTEGER,
    "enviadoA" TEXT,
    "descargas" INTEGER NOT NULL DEFAULT 0,
    "expiraEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdfs_compartidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_activo_nombre_idx" ON "clientes"("activo", "nombre");

-- CreateIndex
CREATE INDEX "cotizaciones_clienteId_creadoEn_idx" ON "cotizaciones"("clienteId", "creadoEn");

-- CreateIndex
CREATE INDEX "cotizaciones_estado_idx" ON "cotizaciones"("estado");

-- CreateIndex
CREATE INDEX "lineas_cotizacion_cotizacionId_orden_idx" ON "lineas_cotizacion"("cotizacionId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "pdfs_compartidos_token_key" ON "pdfs_compartidos"("token");

-- CreateIndex
CREATE INDEX "pdfs_compartidos_cotizacionId_idx" ON "pdfs_compartidos"("cotizacionId");

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_cotizacion" ADD CONSTRAINT "lineas_cotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizaciones"("numero") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_cotizacion" ADD CONSTRAINT "lineas_cotizacion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdfs_compartidos" ADD CONSTRAINT "pdfs_compartidos_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizaciones"("numero") ON DELETE CASCADE ON UPDATE CASCADE;
