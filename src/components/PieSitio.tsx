type DatosPie = {
  razonSocial: string;
  rut: string;
  direccion: string;
  correo: string;
  whatsapp: string;
} | null;

/** Convierte "+56 9 5149 9687" en el número que espera el enlace wa.me. */
export function enlaceWhatsapp(numero: string): string {
  const limpio = numero.replace(/\D/g, "");
  return `https://wa.me/${limpio}`;
}

export function PieSitio({ ajustes }: { ajustes: DatosPie }) {
  if (!ajustes) return null;

  return (
    <footer className="mt-16 bg-verde-700 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-verde-100/70">
              Condiciones comerciales
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              Solicita tu <span className="text-dorado-500">cotización</span> hoy
            </h2>
          </div>
          <a
            href={enlaceWhatsapp(ajustes.whatsapp)}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full bg-dorado-500 px-6 py-3 text-base font-bold text-azul-950 transition hover:bg-dorado-200"
          >
            WhatsApp {ajustes.whatsapp}
          </a>
        </div>

        <dl className="mt-10 grid gap-6 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <DatoPie etiqueta="Razón social" valor={ajustes.razonSocial} />
          <DatoPie etiqueta="RUT" valor={ajustes.rut} />
          <DatoPie etiqueta="Dirección" valor={ajustes.direccion} />
          <DatoPie
            etiqueta="Correo"
            valor={
              <a
                href={`mailto:${ajustes.correo}`}
                className="underline decoration-dorado-500/60 underline-offset-4 hover:text-dorado-200"
              >
                {ajustes.correo}
              </a>
            }
          />
        </dl>
      </div>
    </footer>
  );
}

function DatoPie({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-verde-100/60">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-[15px] leading-snug">{valor}</dd>
    </div>
  );
}
