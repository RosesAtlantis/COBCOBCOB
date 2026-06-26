import { CadastroHeader } from "@/components/cadastros/cadastro-header";
import { CentralSummaryCard } from "@/components/financeiro/central-summary-card";
import { ParcelasFilters } from "@/components/financeiro/parcelas-filters";
import { ParcelasCentralTable } from "@/components/financeiro/parcelas-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { parseInstallmentCenterFilters } from "@/lib/financeiro-filters";
import { getParcelasPageData } from "@/services/parcelas-service";

interface ParcelasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ParcelasPage({ searchParams }: ParcelasPageProps) {
  const filters = parseInstallmentCenterFilters(await searchParams);
  const data = await getParcelasPageData(filters);

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Operacao"
        title="Parcelas"
        description="Fila financeira por vencimento com saldo, atraso e atalho para baixa."
        actions={
          <>
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.installments.length} parcela(s)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </>
        }
      />

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-8">
        <CentralSummaryCard
          label="Pendentes"
          value={formatNumber(data.summary.pendentes)}
        />
        <CentralSummaryCard
          label="Vencidas"
          value={formatNumber(data.summary.vencidas)}
        />
        <CentralSummaryCard
          label="Pagas"
          value={formatNumber(data.summary.pagas)}
        />
        <CentralSummaryCard
          label="Valor vencido"
          value={formatCurrency(data.summary.valorVencido)}
        />
        <CentralSummaryCard
          label="A vencer"
          value={formatCurrency(data.summary.valorAVencer)}
        />
        <CentralSummaryCard
          label="Recebido"
          value={formatCurrency(data.summary.recebido)}
        />
        <CentralSummaryCard
          label="Receita novo"
          value={formatNumber(data.summary.novo ?? 0)}
        />
        <CentralSummaryCard
          label="Receita colchao"
          value={formatNumber(data.summary.colchao ?? 0)}
        />
      </section>

      <ParcelasFilters
        key={JSON.stringify(data.filters)}
        filters={data.filters}
        options={data.options}
      />
      <ParcelasCentralTable
        rows={data.installments}
        agreements={data.agreements}
        wallets={data.options.wallets}
        operators={data.options.operators}
        canRegisterWriteOff={data.canRegisterWriteOff}
        canEditInstallmentRevenueType={data.canEditInstallmentRevenueType}
      />
    </div>
  );
}
