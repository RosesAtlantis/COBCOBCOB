import { EmptyState } from "@/components/empty-state";
import { OperadoresPageClient } from "@/components/operadores/operadores-page-client";
import { PermissionGuard } from "@/components/permission-guard";
import { getOperadoresPageData } from "@/services/operadores-service";

export default async function OperadoresPage() {
  const data = await getOperadoresPageData();

  return (
    <PermissionGuard
      role={data.profile.perfil}
      allowedRoles={["admin", "gerente", "supervisor"]}
      fallback={
        <EmptyState
          title="Sem permissao para acessar operadores"
          description="Este perfil nao possui acesso ao cadastro manual de operadores."
          actionHref="/dashboard"
          actionLabel="Voltar ao painel"
        />
      }
    >
      <OperadoresPageClient initialData={data} />
    </PermissionGuard>
  );
}
