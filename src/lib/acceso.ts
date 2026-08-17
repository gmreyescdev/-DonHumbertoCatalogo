/**
 * Interruptor único del acceso de clientes.
 *
 * Hoy la aplicación es interna: solo entra el equipo de la empresa. Los clientes
 * son fichas de contacto (modelo `Cliente`) a las que se les envían cotizaciones,
 * no cuentas con las que se pueda iniciar sesión.
 *
 * Para reabrir el catálogo a los clientes más adelante basta con poner `true`
 * aquí: el rol CLIENTE, el catálogo y sus permisos siguen implementados.
 */
export const ACCESO_CLIENTES_HABILITADO = false;

export const MENSAJE_ACCESO_CERRADO =
  "El acceso de clientes está cerrado por ahora. Si necesitas precios, pídenos una cotización.";
