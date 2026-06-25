import { EmptyState } from "@/components/empty-state";
import { MetasPageClient } from "@/components/metas/metas-page-client";
import { PermissionGuard } from "@/components/permission-guard";
import { getMetasPageData } from "@/services/metas-service";

export default async function MetasPage() {
  const data = await getMetasPageData();

  return (
    <PermissionGuard
      role={data.profile.perfil}
      allowedRoles={["admin", "gerente", "supervisor", "financeiro"]}
      fallback={
        <EmptyState
          title="Sem permissao para acessar metas"
          description="Este perfil nao possui acesso ao cadastro manual de metas."
          actionHref="/dashboard"
          actionLabel="Voltar ao painel"
        />
      }
    >
      <MetasPageClient initialData={data} />
    </PermissionGuard>
  );
}
