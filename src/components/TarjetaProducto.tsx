import Image from "next/image";
import { miles } from "@/lib/formato";

export type ProductoTarjeta = {
  id: string;
  nombre: string;
  formato: string;
  descripcion: string | null;
  color: string;
  precioNeto: number;
  precioFirme: number;
  destacado: boolean;
  imagenId: string | null;
  categoria: { nombre: string } | null;
};

export function TarjetaProducto({ producto }: { producto: ProductoTarjeta }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgb(15_44_92/0.08)] ring-1 ring-slate-200/70 transition hover:shadow-[0_10px_28px_rgb(15_44_92/0.14)]">
      {/* Barra de color del producto */}
      <span
        aria-hidden
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: producto.color }}
      />

      <div className="relative flex h-56 items-center justify-center bg-crema p-4">
        {producto.imagenId ? (
          <Image
            src={`/api/imagenes/${producto.imagenId}`}
            alt={producto.nombre}
            width={220}
            height={280}
            className="h-full w-auto object-contain drop-shadow-sm transition duration-300 group-hover:scale-[1.04]"
            unoptimized
          />
        ) : (
          <span className="text-sm text-slate-400">Sin foto</span>
        )}

        {producto.destacado ? (
          <span className="absolute top-3 left-3 rounded-full bg-dorado-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-azul-950">
            Destacado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {producto.categoria ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {producto.categoria.nombre}
          </p>
        ) : null}

        <h3 className="mt-1 font-display text-xl leading-tight font-semibold text-azul-800">
          {producto.nombre}
        </h3>

        <p className="mt-1.5 text-[13px] leading-snug text-slate-500">
          {producto.formato}
        </p>

        {producto.descripcion ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {producto.descripcion}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2.5 pt-1">
          <CajaPrecio etiqueta="Neto + IVA" valor={producto.precioNeto} />
          <CajaPrecio etiqueta="Compra firme" valor={producto.precioFirme} firme />
        </div>
      </div>
    </article>
  );
}

function CajaPrecio({
  etiqueta,
  valor,
  firme,
}: {
  etiqueta: string;
  valor: number;
  firme?: boolean;
}) {
  return (
    <div
      className={
        firme
          ? "rounded-xl bg-rojo-100 px-3 py-2.5 text-center"
          : "rounded-xl bg-azul-50 px-3 py-2.5 text-center"
      }
    >
      <p
        className={
          firme
            ? "text-[10px] font-bold uppercase tracking-[0.08em] text-rojo-700/70"
            : "text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
        }
      >
        {etiqueta}
      </p>
      <p
        className={
          firme
            ? "mt-0.5 text-2xl font-extrabold text-rojo-600 tabular-nums"
            : "mt-0.5 text-2xl font-extrabold text-tinta tabular-nums"
        }
      >
        <span className="text-base font-bold">$</span>
        {miles(valor)}
      </p>
      <p className="text-[10px] text-slate-400">por kg</p>
    </div>
  );
}
