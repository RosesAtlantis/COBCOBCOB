import { AcordosFilters } from "@/components/financeiro/acordos-filters";
import { AcordosTable } from "@/components/financeiro/acordos-table";
import { CadastroHeader } from "@/components/cadastros/cadastro-header";
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
      <CadastroHeader
        eyebrow="Operacao"
        title="Acordos"
        description="Negociacoes por cliente, contrato, operador e carteira."
        actions={
          <>
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.agreements.length} acordo(s)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </>
        }
      />

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-9">
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
        <CentralSummaryCard
          label="Honorarios previstos"
          value={formatCurrency(data.summary.honorariosPrevistos ?? 0)}
        />
        <CentralSummaryCard
          label="Escritorio previsto"
          value={formatCurrency(data.summary.valorEscritorioPrevisto ?? 0)}
        />
      </section>

      <AcordosFilters
        key={JSON.stringify(data.filters)}
        filters={data.filters}
        options={data.options}
      />
      <AcordosTable
        rows={data.agreements}
        wallets={data.options.wallets}
        canCancel={data.canCancelAgreement}
        canRegisterWriteOff={data.canRegisterWriteOff}
      />
    </div>
  );
}
