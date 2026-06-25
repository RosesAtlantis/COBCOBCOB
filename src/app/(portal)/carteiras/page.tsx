import { CarteirasPageClient } from "@/components/carteiras/carteiras-page-client";
import { EmptyState } from "@/components/empty-state";
import { PermissionGuard } from "@/components/permission-guard";
import { getCarteirasPageData } from "@/services/carteiras-service";

export default async function CarteirasPage() {
  const data = await getCarteirasPageData();

  return (
    <PermissionGuard
      role={data.profile.perfil}
      allowedRoles={["admin", "gerente", "supervisor", "financeiro"]}
      fallback={
        <EmptyState
          title="Sem permissao para acessar carteiras"
          description="Este perfil nao possui acesso ao cadastro manual de carteiras."
          actionHref="/dashboard"
          actionLabel="Voltar ao painel"
        />
      }
    >
      <CarteirasPageClient initialData={data} />
    </PermissionGuard>
  );
}
