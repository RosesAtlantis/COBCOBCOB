import { ChartCard } from "@/components/chart-card";
import { FilterBar } from "@/components/filter-bar";
import { RankingTable } from "@/components/ranking-table";
import { Badge } from "@/components/ui/badge";
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Ranking operacional
              </p>
              <h2 className="mt-2 text-lg font-semibold">Resumo do ranking</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Visao rapida dos operadores com melhor performance no recorte selecionado.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              Operadores
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {data.operatorRanking.slice(0, 5).map((row) => (
              <div
                key={row.operatorId}
                className="dashboard-subtle flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <Badge
                    variant={row.position <= 3 ? "default" : "outline"}
                    className="rounded-md px-2 py-0.5 text-[11px]"
                  >
                    #{row.position}
                  </Badge>
                  <p className="mt-3 truncate font-medium">{row.operator}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.team} | {row.wallet}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(row.collected)}</p>
                  <p className="text-xs font-medium text-primary">
                    {formatPercent(row.goalCompletion)}
                  </p>
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
            { key: "arrecadacao", label: "Arrecadacao", color: "#7aa2f7" },
            { key: "acordos", label: "Acordos", color: "#6bc4c8" },
          ]}
          variant="area"
        />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Tabela completa de operadores</h2>
          <p className="text-sm text-muted-foreground">
            Comparativo completo de arrecadacao, acordos, meta e ticket medio.
          </p>
        </div>
        <RankingTable rows={data.operatorRanking} />
      </section>
    </div>
  );
}
