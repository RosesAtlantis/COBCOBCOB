import Link from "next/link";

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
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Operacao
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Consulta e gestao de clientes em cobranca com contrato, acordo,
              baixa financeira e historico operacional no mesmo fluxo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.canCreateCase ? (
              <>
                <ClientQuickCaseDialog
                  operators={quickCaseData.operators}
                  teams={quickCaseData.teams}
                  wallets={quickCaseData.wallets}
                  creditors={quickCaseData.creditors}
                  walletCreditors={quickCaseData.walletCreditors}
                  canManageCreditors={quickCaseData.canManageCreditors}
                />
                <Link
                  href="/clientes/novo"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}
                >
                  Abrir formulario completo
                </Link>
              </>
            ) : null}
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.clients.length} cliente(s) visivel(is)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      <ClientesFilters filters={data.filters} options={data.options} />
      <ClientesTable rows={data.clients} />
    </div>
  );
}
