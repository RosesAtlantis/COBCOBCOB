import { EmptyState } from "@/components/empty-state";
import { PermissionGuard } from "@/components/permission-guard";
import { ProfilesPageClient } from "@/components/profiles/profiles-page-client";
import { getProfilesPageData } from "@/services/profiles-service";

export default async function AdminUsuariosPage() {
  const data = await getProfilesPageData();

  return (
    <PermissionGuard
      role={data.profile.perfil}
      allowedRoles={["admin", "gerente"]}
      fallback={
        <EmptyState
          title="Sem permissao para acessar usuarios"
          description="Este perfil nao possui acesso a administracao de usuarios do portal."
          actionHref="/dashboard"
          actionLabel="Voltar ao painel"
        />
      }
    >
      <ProfilesPageClient initialData={data} />
    </PermissionGuard>
  );
}
