import { CreditorsPageClient } from "@/components/credores/creditors-page-client";
import { EmptyState } from "@/components/empty-state";
import { PermissionGuard } from "@/components/permission-guard";
import { getCredoresPageData } from "@/services/credores-service";

export default async function CredoresPage() {
  const data = await getCredoresPageData();

  return (
    <PermissionGuard
      role={data.profile.perfil}
      allowedRoles={["admin", "gerente", "supervisor", "financeiro"]}
      fallback={
        <EmptyState
          title="Sem permissao para acessar credores"
          description="Este perfil nao possui acesso ao cadastro mestre de credores."
          actionHref="/dashboard"
          actionLabel="Voltar ao painel"
        />
      }
    >
      <CreditorsPageClient initialData={data} />
    </PermissionGuard>
  );
}
