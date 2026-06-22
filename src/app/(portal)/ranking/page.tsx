import { ChartCard } from "@/components/chart-card";
import { FilterBar } from "@/components/filter-bar";
import { RankingTable } from "@/components/ranking-table";
import { formatCurrency, formatPercent } from "@/lib/format";
import { parseDashboardFilters } from "@/lib/portal-filters";
import { getDashboardPageData } from "@/services/portal-service";

interface RankingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RankingPage({
  searchParams,
}: RankingPageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getDashboardPageData(filters);

  return (
    <div className="space-y-6">
      <FilterBar filters={data.filters} options={data.options} />

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="dashboard-surface p-5">
          <p className="text-sm font-medium text-muted-foreground">Resumo do ranking</p>
          <div className="mt-5 space-y-4">
            {data.operatorRanking.slice(0, 5).map((row) => (
              <div
                key={row.operatorId}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-muted-foreground">#{row.position}</p>
                  <p className="font-medium">{row.operator}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.team} • {row.wallet}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(row.collected)}</p>
                  <p className="text-xs text-primary">{formatPercent(row.goalCompletion)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          title="Evolucao mensal dos rankings"
          description="Volume agregado por mes para apoiar comparacoes sazonais."
          data={data.monthlyEvolution}
          xKey="label"
          series={[
            { key: "arrecadacao", label: "Arrecadacao", color: "#f2c14e" },
            { key: "acordos", label: "Acordos", color: "#39a0ed" },
          ]}
          variant="area"
        />
      </div>

      <RankingTable rows={data.operatorRanking} />
    </div>
  );
}
