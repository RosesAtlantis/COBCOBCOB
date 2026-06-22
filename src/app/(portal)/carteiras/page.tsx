import { ChartCard } from "@/components/chart-card";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Gestao de carteiras
              </p>
              <h2 className="mt-2 text-lg font-semibold">Carteiras lideres</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Recorte das carteiras com melhor arrecadacao e maior consistencia.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              Top 3
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {data.wallets.slice(0, 3).map((wallet) => (
              <div key={wallet.walletId} className="dashboard-subtle p-4">
                <p className="font-medium">{wallet.wallet}</p>
                <p className="text-sm text-muted-foreground">{wallet.creditor}</p>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {formatCurrency(wallet.collected)}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Melhor operador: {wallet.topOperator}</span>
                  <span>{formatPercent(wallet.recoveryRate)} recuperacao</span>
                </div>
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
            { key: "arrecadacao", label: "Arrecadacao", color: "#7aa2f7" },
            { key: "meta", label: "Meta", color: "#d3a66b" },
          ]}
          variant="bar"
        />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Visao detalhada das carteiras</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhamento completo de credor, arrecadacao, acordos e recuperacao.
          </p>
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
      </section>
    </div>
  );
}
