import { EmptyState } from "@/components/empty-state";
import { ImportUpload } from "@/components/import-upload";
import { ImportsTable } from "@/components/imports-table";
import { PermissionGuard } from "@/components/permission-guard";
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
        <ImportsTable rows={imports} />
      </div>
    </PermissionGuard>
  );
}
