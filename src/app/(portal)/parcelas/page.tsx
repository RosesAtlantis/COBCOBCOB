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
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Financeiro
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Central de parcelas</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Fila financeira por vencimento com saldo, atraso, contexto do acordo e
              atalho direto para baixa operacional.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.installments.length} parcela(s) visivel(is)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

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

      <ParcelasFilters filters={data.filters} options={data.options} />
      <ParcelasCentralTable
        rows={data.installments}
        agreements={data.agreements}
        wallets={data.options.wallets}
        canRegisterWriteOff={data.canRegisterWriteOff}
        canEditInstallmentRevenueType={data.canEditInstallmentRevenueType}
      />
    </div>
  );
}
