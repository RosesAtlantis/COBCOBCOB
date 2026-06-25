import Link from "next/link";

import { CadastroHeader } from "@/components/cadastros/cadastro-header";
import { ClientQuickCaseDialog } from "@/components/clientes/client-quick-case-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientesFilters } from "@/components/clientes/clientes-filters";
import { ClientesTable } from "@/components/clientes/clientes-table";
import { parseClientFilters } from "@/lib/clientes-filters";
import { cn } from "@/lib/utils";
import {
  getClientesPageData,
  getNovoClientePageData,
} from "@/services/clientes-service";

interface ClientesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const filters = parseClientFilters(await searchParams);
  const [data, quickCaseData] = await Promise.all([
    getClientesPageData(filters),
    getNovoClientePageData(),
  ]);

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Operacao"
        title="Clientes"
        description="Consulta e gestao de casos em cobranca."
        actions={
          <>
            {data.canCreateCase ? (
              <>
                <ClientQuickCaseDialog
                  operators={quickCaseData.operators}
                  teams={quickCaseData.teams}
                  wallets={quickCaseData.wallets}
                  creditors={quickCaseData.creditors}
                  walletCreditors={quickCaseData.walletCreditors}
                  canManageCreditors={quickCaseData.canManageCreditors}
                  canManageWallets={quickCaseData.canManageWallets}
                />
                <Link
                  href="/clientes/novo"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}
                >
                  Formulario completo
                </Link>
              </>
            ) : null}
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.clients.length} cliente(s)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </>
        }
      />

      <ClientesFilters filters={data.filters} options={data.options} />
      <ClientesTable rows={data.clients} />
    </div>
  );
}
