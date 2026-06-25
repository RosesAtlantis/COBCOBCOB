import { EmptyState } from "@/components/empty-state";
import { NovoCasoForm } from "@/components/clientes/novo-caso-form";
import { PermissionGuard } from "@/components/permission-guard";
import { Badge } from "@/components/ui/badge";
import { getNovoClientePageData } from "@/services/clientes-service";

export default async function NovoClientePage() {
  const data = await getNovoClientePageData();

  return (
    <PermissionGuard
      role={data.profile.perfil}
      allowedRoles={["admin", "gerente", "supervisor", "operador"]}
      fallback={
        <EmptyState
          title="Sem permissao para criar caso manual"
          description="Este perfil pode consultar a operacao, mas nao pode abrir casos manualmente."
          actionHref="/clientes"
          actionLabel="Voltar para clientes"
        />
      }
    >
      <div className="space-y-6">
        <section className="dashboard-surface p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cobranca
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Novo caso</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Cadastre manualmente um cliente em cobranca com nome, CPF/CNPJ e carteira como minimo obrigatorio.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-md px-3 py-1">
                Cadastro manual
              </Badge>
              {data.demoMode ? (
                <Badge variant="outline" className="rounded-md px-3 py-1">
                  Demo
                </Badge>
              ) : null}
            </div>
          </div>
        </section>

        <NovoCasoForm
          operators={data.operators}
          teams={data.teams}
          wallets={data.wallets}
          canManageWallets={data.canManageWallets}
        />
      </div>
    </PermissionGuard>
  );
}
