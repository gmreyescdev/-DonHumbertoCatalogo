# Catálogo Don Humberto

Herramienta interna de **Comercializadora Valle del Maule Ltda** para administrar el
catálogo de legumbres, armar cotizaciones con precios propios por cliente y
enviárselas por WhatsApp en PDF.

Reemplaza al archivo `editor_catalogo_don_humberto_1.html`, que guardaba todo dentro
del propio HTML. Ahora los productos, precios, fotos y usuarios viven en una base de
datos PostgreSQL y se administran desde el navegador.

---

## Qué hace

- **Uso interno.** Entra solo el equipo de la empresa. Los clientes no tienen
  cuenta: reciben cotizaciones por WhatsApp.
- **Cotizaciones personalizadas.** Precios propios por cliente (el despacho hace
  variar el valor), con cantidades, IVA y total, y su PDF individual.
- **Envío por WhatsApp.** Pides el número, se guarda el PDF con un enlace privado
  y se abre WhatsApp con el mensaje listo. Desde el celular, además, se puede
  adjuntar el archivo directamente.
- **Fichas de cliente.** Empresa, RUT, contacto, WhatsApp y dirección de despacho,
  con el historial de todo lo que le has cotizado.
- **Precios base editables.** Una pantalla para actualizar todos los valores de una
  vez, igual que el editor anterior, pero guardando en la base de datos.
- **Historial de precios.** Cada cambio queda registrado con fecha, autor y variación
  porcentual.
- **Productos ilimitados.** Agrega, edita, oculta o elimina productos y súbeles fotos
  desde el celular o el computador.
- **PDF de 3+ hojas.** Portada, lista de precios y contacto, con el mismo diseño del
  catálogo original. Se agregan hojas solas a medida que crecen los productos.
- **Datos de la empresa editables.** Razón social, RUT, dirección, correo, WhatsApp,
  logo y condiciones comerciales, sin tocar código.

---

## Tecnología

| Pieza | Elección |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL vía Prisma 7 |
| Sesiones | JWT firmado (`jose`) en cookie httpOnly + `bcryptjs` |
| Fotos | Guardadas en la base y servidas por `/api/imagenes/[id]` |
| PDF | `html2canvas` + `jsPDF` en el navegador |

---

## Poner en marcha en tu computador

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
```

**1. Levanta la base de datos local** (deja esta ventana abierta):

```bash
npm run db:dev
```

**2. Copia `.env.example` a `.env`** y pega en `DATABASE_URL` y `SHADOW_DATABASE_URL`
las dos direcciones que imprimió el comando anterior. Completa también `AUTH_SECRET`,
`ADMIN_EMAIL` y `ADMIN_PASSWORD`.

Para generar el `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

**3. Crea las tablas y carga los datos iniciales** (en otra ventana):

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

Esto deja cargados los 7 productos con sus fotos y precios originales, el logo, los
datos de la empresa y tu cuenta de administrador.

**4. Arranca la aplicación:**

```bash
npm run dev
```

Abre <http://localhost:3000> y entra con el `ADMIN_EMAIL` y `ADMIN_PASSWORD` de tu `.env`.

---

## Cómo se usa

| Sección | Para qué sirve |
| --- | --- |
| **Catálogo** (`/`) | Lista de precios base, con fotos, buscador y filtro por categoría. Referencia interna. |
| **Administración › Cotizaciones** | Crear cotizaciones con precios propios por cliente, ver su estado y enviarlas. |
| **Administración › Clientes** | Fichas de contacto: empresa, RUT, WhatsApp, dirección de despacho e historial. |
| **Administración › Precios** | Actualizar todos los precios base en una pantalla. Marca en dorado lo que cambiaste. |
| **Administración › Productos** | Crear, editar, ocultar o eliminar productos y subir sus fotos. |
| **Administración › Historial** | Todos los cambios de precio con fecha, autor y variación. |
| **Administración › Equipo** | Cuentas con las que entra tu gente a administrar. |
| **Administración › Empresa** | Logo, razón social, RUT, dirección, correo, WhatsApp, condiciones y categorías. |
| **Descargar PDF** (`/pdf`) | Catálogo general en PDF con los precios base. |

### Cotizar y enviar a un cliente

1. **Administración › Clientes › Agregar cliente.** Con el WhatsApp cargado, después
   el número aparece solo al enviar.
2. **Cotizar** (o **Cotizaciones › Nueva cotización**). Marca los productos, pon
   los kilos y ajusta el precio de cada uno para ese cliente. El neto, el IVA y el
   total se calculan solos.
3. Guarda y entra en **Ver PDF y enviar**.
4. Revisa el número y aprieta **Enviar por WhatsApp**.

La próxima vez que le cotices a ese mismo cliente, se proponen los precios y
cantidades de su cotización anterior.

### Cómo llega el PDF al cliente

WhatsApp no permite adjuntar un archivo desde un enlace web: los enlaces `wa.me`
solo llevan número y texto. Por eso el envío funciona así:

1. Se genera el PDF en tu navegador.
2. Se guarda en la base de datos con un token aleatorio de 32 bytes.
3. Se abre WhatsApp con el mensaje y el enlace `tudominio.cl/c/<token>` ya escritos.
4. Tu cliente toca el enlace y abre el PDF. No necesita cuenta.

El enlace caduca a los 90 días y no lo indexan los buscadores. Desde el celular
aparece además el botón **Compartir PDF**, que sí adjunta el archivo de verdad
usando el menú del sistema; ahí el contacto se elige dentro de WhatsApp.

### Sobre el acceso de los clientes

Hoy está cerrado: una cuenta con rol *Cliente* no puede entrar. Si más adelante
quieres reabrir el catálogo a tus clientes, cambia `ACCESO_CLIENTES_HABILITADO`
a `true` en [`src/lib/acceso.ts`](src/lib/acceso.ts). El rol, el catálogo y sus
permisos siguen implementados.

---

## Publicar en internet (Vercel + Neon, gratis)

### 1. Crear la base de datos

1. Entra a [neon.com](https://neon.com) y crea un proyecto PostgreSQL.
2. En **Connection string**, copia las dos versiones:
   - **Pooled connection** → será `DATABASE_URL`
   - **Direct connection** → será `MIGRATE_DATABASE_URL`

> Las migraciones necesitan la conexión directa porque el pooler no soporta los
> bloqueos que usa Prisma. La aplicación, en cambio, usa la pooled.

### 2. Subir el código

```bash
git init
```

```bash
git add . && git commit -m "Catálogo Don Humberto"
```

Sube el repositorio a GitHub y en [vercel.com](https://vercel.com) elige
**Add New › Project** e impórtalo.

### 3. Configurar las variables

En Vercel, **Settings › Environment Variables**, agrega:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | Pooled connection de Neon |
| `MIGRATE_DATABASE_URL` | Direct connection de Neon |
| `AUTH_SECRET` | Una clave nueva de 48 bytes (no reuses la local) |
| `ADMIN_EMAIL` | Tu correo |
| `ADMIN_PASSWORD` | Una contraseña larga |
| `ADMIN_NOMBRE` | Tu nombre |

Vercel ejecuta las migraciones solo durante el `build`, así que no hay pasos extra.

### 4. Cargar los datos iniciales

Una única vez, desde tu computador, apuntando a la base de producción. En Windows
PowerShell:

```bash
$env:DATABASE_URL="<pooled de Neon>"; $env:ADMIN_EMAIL="tu-correo@ejemplo.cl"; $env:ADMIN_PASSWORD="tu-clave-larga"; npm run db:seed
```

Cierra esa ventana al terminar, para que esas variables no queden cargadas.

Listo: entra a tu dominio de Vercel con el `ADMIN_EMAIL` y `ADMIN_PASSWORD` que
configuraste.

---

## Estructura

```
prisma/
  schema.prisma        Modelo de datos
  seed.ts              Carga inicial (productos, fotos, admin)
  seed-assets/         Fotos originales del catálogo
src/
  acciones/            Server Actions (auth, productos, clientes, cotizaciones…)
  app/
    (sitio)/           Login, catálogo y panel de administración
    (impresion)/       Catálogo y cotizaciones imprimibles — raíz aparte, sin Tailwind
    api/imagenes/[id]/ Sirve las fotos guardadas en la base
    api/pdf-compartido Guarda el PDF generado y devuelve su enlace privado
    c/[token]/         Descarga pública del PDF (la que recibe el cliente)
  components/          Componentes de interfaz
  lib/                 Prisma, sesiones, contraseñas, formato, imágenes, cálculos
```

---

## Decisiones que conviene conocer

**El catálogo imprimible tiene su propio CSS.** Tailwind v4 escribe los colores con
`oklch()`, y `html2canvas` —la librería que convierte la página en imagen para el
PDF— no sabe interpretar esa función y falla. Por eso `/pdf` es una raíz de
aplicación aparte, con colores en hexadecimal en `src/app/(impresion)/impresion.css`.
Si algún día agregas estilos ahí, mantenlos en hexadecimal.

**Las hojas del PDF miden 794 × 1123 px fijos.** Es una A4 a 96 ppp. No las escales
para que quepan en pantalla: el PDF saldría con las proporciones cambiadas. En
pantallas angostas la hoja se desplaza en horizontal a propósito.

**Las fotos van dentro de la base de datos.** Son pocas y se comprimen a 1000 px con
`sharp` al subirlas, así que no hace falta contratar un servicio de almacenamiento
aparte. Si algún día llegas a cientos de productos, conviene mover las imágenes a
Vercel Blob o similar.

**Las sesiones no consultan solo la cookie.** Cada petición verifica en la base que
la cuenta siga activa, para que al desactivar a un cliente pierda el acceso de
inmediato y no cuando expire su sesión.

**Los precios se guardan como enteros.** El kilo se cobra en pesos redondos, así que
no hay decimales que puedan arrastrar errores de redondeo. El IVA se redondea una
sola vez, al final, en [`src/lib/cotizacion.ts`](src/lib/cotizacion.ts) — el mismo
archivo lo usan la pantalla de edición, el listado y el PDF, para que los tres
muestren exactamente el mismo total.

**Las líneas de cotización guardan copia del nombre y el formato.** Si después
renombras un producto o cambias su formato, una cotización ya enviada tiene que
seguir diciendo lo mismo que vio el cliente.

**El IVA se guarda en cada cotización.** Si algún día cambia la tasa, los documentos
antiguos siguen cuadrando.

---

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción (incluye migraciones) |
| `npm run db:dev` | Levanta PostgreSQL local |
| `npm run db:migrate` | Crea y aplica una migración nueva |
| `npm run db:deploy` | Aplica migraciones pendientes (producción) |
| `npm run db:seed` | Carga los datos iniciales |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run db:reset` | Borra todo y vuelve a empezar |
| `npm run typecheck` | Revisa los tipos |

---

## Nota sobre OneDrive

El proyecto está dentro de una carpeta sincronizada con OneDrive. La sincronización
de `node_modules` y `.next` puede volver lento el desarrollo y, a veces, bloquear
archivos. Si notas lentitud, excluye esas dos carpetas desde la configuración de
OneDrive, o mueve el proyecto fuera de OneDrive.
