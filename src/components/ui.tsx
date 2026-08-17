import Link from "next/link";

/* --------------------------------- Avisos -------------------------------- */

export function Aviso({
  tipo = "info",
  children,
}: {
  tipo?: "info" | "ok" | "error";
  children: React.ReactNode;
}) {
  const estilos = {
    info: "border-azul-800/20 bg-azul-50 text-azul-800",
    ok: "border-verde-700/25 bg-verde-100 text-verde-700",
    error: "border-rojo-600/25 bg-rojo-100 text-rojo-700",
  }[tipo];

  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${estilos}`}
    >
      {children}
    </p>
  );
}

/* --------------------------------- Campos -------------------------------- */

const CLASE_CONTROL =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-tinta placeholder:text-slate-400 focus:border-azul-700 focus:ring-0 disabled:bg-slate-100";

export function Campo({
  etiqueta,
  ayuda,
  children,
  htmlFor,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
      >
        {etiqueta}
      </label>
      {children}
      {ayuda ? <p className="mt-1.5 text-xs text-slate-500">{ayuda}</p> : null}
    </div>
  );
}

export function Entrada(props: React.ComponentProps<"input">) {
  return <input {...props} className={`${CLASE_CONTROL} ${props.className ?? ""}`} />;
}

export function AreaTexto(props: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={`${CLASE_CONTROL} leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function Selector(props: React.ComponentProps<"select">) {
  return <select {...props} className={`${CLASE_CONTROL} ${props.className ?? ""}`} />;
}

export function Casilla({
  nombre,
  etiqueta,
  defecto,
  descripcion,
}: {
  nombre: string;
  etiqueta: string;
  defecto?: boolean;
  descripcion?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition hover:border-slate-300">
      <input
        type="checkbox"
        name={nombre}
        defaultChecked={defecto}
        className="mt-0.5 h-4.5 w-4.5 rounded border-slate-300 text-azul-800 focus:ring-azul-700"
      />
      <span>
        <span className="block text-sm font-semibold text-tinta">{etiqueta}</span>
        {descripcion ? (
          <span className="mt-0.5 block text-xs text-slate-500">
            {descripcion}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/* --------------------------------- Botones -------------------------------- */

type Variante = "primario" | "secundario" | "peligro" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-azul-800 text-white hover:bg-azul-700",
  secundario:
    "border border-slate-300 bg-white text-tinta hover:border-slate-400 hover:bg-slate-50",
  peligro: "border border-rojo-600/30 bg-rojo-100 text-rojo-700 hover:bg-rojo-600 hover:text-white",
  fantasma: "text-slate-600 hover:bg-slate-100 hover:text-tinta",
};

export function claseBoton(variante: Variante = "primario", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${extra}`;
}

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: React.ComponentProps<"button"> & { variante?: Variante }) {
  return <button {...props} className={claseBoton(variante, className)} />;
}

export function EnlaceBoton({
  href,
  variante = "primario",
  className = "",
  children,
}: {
  href: string;
  variante?: Variante;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={claseBoton(variante, className)}>
      {children}
    </Link>
  );
}

/* --------------------------------- Bloques -------------------------------- */

export function Panel({
  titulo,
  descripcion,
  acciones,
  children,
}: {
  titulo?: string;
  descripcion?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgb(15_44_92/0.07)] ring-1 ring-slate-200/70 sm:p-6">
      {titulo ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-azul-900">
              {titulo}
            </h2>
            {descripcion ? (
              <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
            ) : null}
          </div>
          {acciones}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Etiqueta({
  tono,
  children,
}: {
  tono: "ok" | "apagado" | "dorado" | "azul";
  children: React.ReactNode;
}) {
  const estilos = {
    ok: "bg-verde-100 text-verde-700",
    apagado: "bg-slate-100 text-slate-500",
    dorado: "bg-dorado-200 text-dorado-600",
    azul: "bg-azul-100 text-azul-800",
  }[tono];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${estilos}`}
    >
      {children}
    </span>
  );
}
