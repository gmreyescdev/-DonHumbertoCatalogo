import { Panel } from "@/components/ui";
import { FormularioCliente } from "@/components/FormularioCliente";

export const dynamic = "force-dynamic";

export default async function PaginaClienteNuevo({
  searchParams,
}: {
  searchParams: Promise<{ cotizar?: string }>;
}) {
  const { cotizar } = await searchParams;

  return (
    <Panel
      titulo="Agregar cliente"
      descripcion="Solo el nombre es obligatorio. El WhatsApp hace falta para poder enviarle la cotización."
    >
      <FormularioCliente luegoCotizar={cotizar === "1"} />
    </Panel>
  );
}
