import { AcordosFilters } from "@/components/financeiro/acordos-filters";
import { AcordosTable } from "@/components/financeiro/acordos-table";
import { CentralSummaryCard } from "@/components/financeiro/central-summary-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { parseAgreementCenterFilters } from "@/lib/financeiro-filters";
import { getAcordosPageData } from "@/services/acordos-service";

interface AcordosPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AcordosPage({ searchParams }: AcordosPageProps) {
  const filters = parseAgreementCenterFilters(await searchParams);
  const data = await getAcordosPageData(filters);

  return (
    <div className="space-y-6">
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Financeiro
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Central de acordos</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Negociacoes por cliente, contrato, operador e carteira com baixa,
              cancelamento e historico no mesmo fluxo operacional.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.agreements.length} acordo(s) visivel(is)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-7">
        <CentralSummaryCard
          label="Ativos"
          value={formatNumber(data.summary.ativos)}
        />
        <CentralSummaryCard
          label="Total acordado"
          value={formatCurrency(data.summary.totalAcordado)}
        />
        <CentralSummaryCard
          label="Pago"
          value={formatCurrency(data.summary.pago)}
        />
        <CentralSummaryCard
          label="Saldo em aberto"
          value={formatCurrency(data.summary.saldoEmAberto)}
        />
        <CentralSummaryCard
          label="Parcelas vencidas"
          value={formatNumber(data.summary.parcelasVencidas)}
        />
        <CentralSummaryCard
          label="Quitados"
          value={formatNumber(data.summary.acordosQuitados)}
        />
        <CentralSummaryCard
          label="Cancelados"
          value={formatNumber(data.summary.cancelados)}
        />
      </section>

      <AcordosFilters filters={data.filters} options={data.options} />
      <AcordosTable
        rows={data.agreements}
        canCancel={data.canCancelAgreement}
        canRegisterWriteOff={data.canRegisterWriteOff}
      />
    </div>
  );
}
