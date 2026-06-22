import { ChartCard } from "@/components/chart-card";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import { parseDashboardFilters } from "@/lib/portal-filters";
import { getWalletPageData } from "@/services/portal-service";

interface WalletsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getWalletPageData(filters);

  return (
    <div className="space-y-6">
      <FilterBar filters={data.filters} options={data.options} />

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="dashboard-surface p-5">
          <h2 className="text-lg font-semibold">Carteiras lideres</h2>
          <div className="mt-5 space-y-4">
            {data.wallets.slice(0, 3).map((wallet) => (
              <div
                key={wallet.walletId}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4"
              >
                <p className="font-medium">{wallet.wallet}</p>
                <p className="text-sm text-muted-foreground">{wallet.creditor}</p>
                <p className="mt-4 text-2xl font-semibold">
                  {formatCurrency(wallet.collected)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Melhor operador: {wallet.topOperator}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          title="Historico por carteira"
          description="Curva mensal consolidada da arrecadacao."
          data={data.evolution}
          xKey="label"
          series={[
            { key: "arrecadacao", label: "Arrecadacao", color: "#f2c14e" },
            { key: "meta", label: "Meta", color: "#5271ff" },
          ]}
          variant="bar"
        />
      </div>

      <DataTable
        rows={data.wallets}
        columns={[
          { key: "wallet", header: "Carteira" },
          { key: "creditor", header: "Credor" },
          {
            key: "collected",
            header: "Arrecadado",
            align: "right",
            render: (row) => formatCurrency(row.collected),
          },
          {
            key: "agreements",
            header: "Acordos",
            align: "right",
            render: (row) => formatNumber(row.agreements),
          },
          {
            key: "averageTicket",
            header: "Ticket medio",
            align: "right",
            render: (row) => formatCurrency(row.averageTicket),
          },
          {
            key: "recoveryRate",
            header: "% Recuperacao",
            align: "right",
            render: (row) => formatPercent(row.recoveryRate),
          },
          { key: "topOperator", header: "Top operador" },
        ]}
      />
    </div>
  );
}
