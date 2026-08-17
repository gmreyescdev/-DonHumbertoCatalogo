import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormularioLogin } from "@/components/FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  if (await usuarioActual()) redirect("/");

  const { volver } = await searchParams;

  const ajustes = await prisma.ajustes.findUnique({
    where: { id: "singleton" },
    select: {
      nombreMarca: true,
      eslogan: true,
      titulo: true,
      region: true,
      whatsapp: true,
      correo: true,
      razonSocial: true,
    },
  });

  const marca = ajustes?.nombreMarca ?? "Don Humberto";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <section className="trama-azul relative flex flex-col justify-between px-8 py-12 text-white sm:px-14 lg:px-16 lg:py-16">
        <div className="w-36 rounded-xl bg-white/95 p-2.5 shadow-lg">
          <Image
            src="/logo.png"
            alt="Empresas Valle del Maule"
            width={220}
            height={95}
            priority
            className="h-auto w-full"
          />
        </div>

        <div className="py-14 lg:py-0">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-dorado-500">
            {ajustes?.region ?? "Región del Maule · Longaví · Chile"}
          </p>
          <h1 className="mt-5 font-display text-6xl leading-[0.92] font-bold sm:text-7xl">
            {marca.split(" ").map((palabra) => (
              <span key={palabra} className="block">
                {palabra}
              </span>
            ))}
          </h1>
          <p className="mt-4 text-lg text-azul-100 italic">
            {ajustes?.eslogan ?? "Legumbres premium · desde 1999"}
          </p>
          <div className="my-8 h-1.5 w-24 rounded bg-rojo-600" />
          <p className="max-w-md text-2xl leading-snug font-semibold text-white/95">
            {ajustes?.titulo ?? "Catálogo Mayorista de Legumbres a Granel"}
          </p>
        </div>

        <p className="text-sm text-azul-100/80">
          ¿Eres cliente y necesitas precios? Escríbenos a{" "}
          <span className="font-semibold text-dorado-200">
            {ajustes?.correo ?? "c.vil.cast@gmail.com"}
          </span>{" "}
          o al WhatsApp{" "}
          <span className="font-semibold text-dorado-200">
            {ajustes?.whatsapp ?? "+56 9 5149 9687"}
          </span>{" "}
          y te enviamos una cotización.
        </p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center bg-crema px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-semibold text-azul-900">
            Acceso interno
          </h2>
          <p className="mt-2 mb-8 text-sm leading-relaxed text-slate-600">
            Uso exclusivo del equipo de {ajustes?.razonSocial ?? "la empresa"}.
            Desde aquí se administran los precios y se preparan las cotizaciones.
          </p>

          <FormularioLogin volver={volver} />
        </div>
      </section>
    </main>
  );
}
