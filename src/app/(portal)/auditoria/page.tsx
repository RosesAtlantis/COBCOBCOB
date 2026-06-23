import { AuditoriaFilters } from "@/components/auditoria/auditoria-filters";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { parseAuditFilters } from "@/lib/auditoria-filters";
import { getAuditoriaPageData } from "@/services/auditoria-service";

interface AuditoriaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuditoriaPage({
  searchParams,
}: AuditoriaPageProps) {
  const filters = parseAuditFilters(await searchParams);
  const data = await getAuditoriaPageData(filters);

  return (
    <div className="space-y-6">
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Dados
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Linha do tempo consolidada de cadastros, acordos, baixas, estornos,
              importacoes e reversoes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.events.length} evento(s)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      <AuditoriaFilters filters={data.filters} options={data.options} />
      <DataTable
        rows={data.events}
        columns={[
          {
            key: "criadoEm",
            header: "Data",
            render: (row) => formatDate(row.criadoEm),
          },
          { key: "entidade", header: "Entidade" },
          { key: "acao", header: "Acao" },
          { key: "descricao", header: "Descricao" },
          { key: "usuarioNome", header: "Usuario" },
          { key: "origem", header: "Origem" },
        ]}
      />
    </div>
  );
}
