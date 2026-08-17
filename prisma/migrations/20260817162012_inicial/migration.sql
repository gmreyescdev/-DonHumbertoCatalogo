-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CLIENTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "formato" TEXT NOT NULL DEFAULT 'Manga 10 kg c/u · Pallet 1.000–1.200 kg',
    "color" TEXT NOT NULL DEFAULT '#153a7a',
    "precioNeto" INTEGER NOT NULL,
    "precioFirme" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "categoriaId" TEXT,
    "imagenId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_precios" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "precioNetoAnterior" INTEGER,
    "precioFirmeAnterior" INTEGER,
    "precioNeto" INTEGER NOT NULL,
    "precioFirme" INTEGER NOT NULL,
    "autorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_precios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "datos" BYTEA NOT NULL,
    "ancho" INTEGER NOT NULL,
    "alto" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nombreMarca" TEXT NOT NULL DEFAULT 'Don Humberto',
    "eslogan" TEXT NOT NULL DEFAULT 'Legumbres premium · desde 1999',
    "titulo" TEXT NOT NULL DEFAULT 'Catálogo Mayorista de Legumbres a Granel',
    "region" TEXT NOT NULL DEFAULT 'Región del Maule · Longaví · Chile',
    "razonSocial" TEXT NOT NULL DEFAULT 'Comercializadora Valle del Maule Ltda',
    "rut" TEXT NOT NULL DEFAULT '76.160.013-3',
    "direccion" TEXT NOT NULL DEFAULT '1 Oriente N°833, Longaví, Región del Maule',
    "correo" TEXT NOT NULL DEFAULT 'c.vil.cast@gmail.com',
    "whatsapp" TEXT NOT NULL DEFAULT '+56 9 5149 9687',
    "condiciones" TEXT NOT NULL DEFAULT 'Formato de despacho: cada producto se entrega en mangas de 10 kg, paletizado entre 1.000 y 1.200 kg por pallet.
Precios: valores en pesos chilenos (CLP) por kilo. Precio neto + IVA y precio de compra firme.
Vigencia: precios de referencia sujetos a confirmación al momento de cotizar.
Pedidos: contáctanos por WhatsApp o correo para confirmar stock y cerrar tu pedido.',
    "logoId" TEXT,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajustes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "productos_slug_key" ON "productos"("slug");

-- CreateIndex
CREATE INDEX "productos_activo_orden_idx" ON "productos"("activo", "orden");

-- CreateIndex
CREATE INDEX "productos_categoriaId_idx" ON "productos"("categoriaId");

-- CreateIndex
CREATE INDEX "historial_precios_productoId_creadoEn_idx" ON "historial_precios"("productoId", "creadoEn");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_imagenId_fkey" FOREIGN KEY ("imagenId") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes" ADD CONSTRAINT "ajustes_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
