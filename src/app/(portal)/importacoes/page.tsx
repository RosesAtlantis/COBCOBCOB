import { EmptyState } from "@/components/empty-state";
import { ImportUpload } from "@/components/import-upload";
import { PermissionGuard } from "@/components/permission-guard";
import { DataTable } from "@/components/data-table";
import { formatDate, formatNumber } from "@/lib/format";
import { getImportsPageData } from "@/services/portal-service";

export default async function ImportsPage() {
  const { profile, imports } = await getImportsPageData();

  return (
    <PermissionGuard
      role={profile.perfil}
      allowedRoles={["admin", "gerente", "supervisor", "financeiro"]}
      fallback={
        <EmptyState
          title="Sem permissao para importar"
          description="Este perfil pode consultar dashboards, mas nao pode processar cargas de arquivos."
          actionHref="/dashboard"
          actionLabel="Voltar ao dashboard"
        />
      }
    >
      <div className="space-y-6">
        <ImportUpload />
        <DataTable
          rows={imports}
          columns={[
            { key: "tipo", header: "Tipo" },
            { key: "nome_arquivo", header: "Arquivo" },
            {
              key: "total_linhas",
              header: "Linhas",
              align: "right",
              render: (row) => formatNumber(row.total_linhas),
            },
            {
              key: "linhas_importadas",
              header: "Importadas",
              align: "right",
              render: (row) => formatNumber(row.linhas_importadas),
            },
            {
              key: "linhas_erro",
              header: "Erros",
              align: "right",
              render: (row) => formatNumber(row.linhas_erro),
            },
            { key: "status", header: "Status" },
            {
              key: "criado_em",
              header: "Data",
              render: (row) => formatDate(row.criado_em),
            },
          ]}
        />
      </div>
    </PermissionGuard>
  );
}
