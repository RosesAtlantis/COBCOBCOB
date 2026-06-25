import { EmptyState } from "@/components/empty-state";
import { EquipesPageClient } from "@/components/equipes/equipes-page-client";
import { PermissionGuard } from "@/components/permission-guard";
import { getEquipesPageData } from "@/services/equipes-service";

export default async function EquipesPage() {
  const data = await getEquipesPageData();

  return (
    <PermissionGuard
      role={data.profile.perfil}
      allowedRoles={["admin", "gerente", "supervisor", "financeiro"]}
      fallback={
        <EmptyState
          title="Sem permissao para acessar equipes"
          description="Este perfil nao possui acesso ao cadastro manual de equipes."
          actionHref="/dashboard"
          actionLabel="Voltar ao painel"
        />
      }
    >
      <EquipesPageClient initialData={data} />
    </PermissionGuard>
  );
}
