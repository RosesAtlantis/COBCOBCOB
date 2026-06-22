import { ArrowUpRight, Medal } from "lucide-react";

import { ChartCard } from "@/components/chart-card";
import { DashboardCard } from "@/components/dashboard-card";
import { FilterBar } from "@/components/filter-bar";
import { RankingTable } from "@/components/ranking-table";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { parseDashboardFilters } from "@/lib/portal-filters";
import { getOperatorPageData } from "@/services/portal-service";

interface OperatorPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OperatorPage({
  searchParams,
}: OperatorPageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getOperatorPageData(filters);

  return (
    <div className="space-y-6">
      <FilterBar
        filters={data.filters}
        options={data.options}
        showOperatorFilter={false}
      />

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Minha arrecadacao"
          value={formatCurrency(data.overview.collected)}
          subtitle={`Meta do periodo: ${formatCurrency(data.overview.goal)}`}
          icon={ArrowUpRight}
          accent="primary"
        />
        <DashboardCard
          title="Atingimento da meta"
          value={formatPercent(data.overview.goalCompletion)}
          subtitle={`Media da equipe: ${formatCurrency(data.overview.teamAverage)}`}
          icon={Medal}
          accent="warning"
        />
        <DashboardCard
          title="Ranking geral"
          value={`#${data.overview.rankingOverall || "-"}`}
          subtitle={`Ranking da equipe: #${data.overview.rankingTeam || "-"}`}
          icon={Medal}
          accent="success"
        />
        <DashboardCard
          title="Acordos fechados"
          value={formatNumber(data.overview.agreements)}
          subtitle={`Ticket medio: ${formatCurrency(data.overview.averageTicket)}`}
          icon={ArrowUpRight}
          accent="info"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="dashboard-surface p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Comparativo com a media da equipe
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">Sua diferenca vs. media</p>
              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency(data.overview.teamAverageGap)}
              </p>
              <p className="mt-1 text-sm text-primary">
                Baseado no desempenho medio do time no mesmo periodo.
              </p>
            </div>
          </div>
        </div>

        <ChartCard
          title="Minha evolucao diaria"
          description="Arrecadacao e acordos no recorte filtrado."
          data={data.overview.dailyEvolution}
          xKey="label"
          series={[
            { key: "arrecadacao", label: "Arrecadacao", color: "#f2c14e" },
            { key: "acordos", label: "Acordos", color: "#39a0ed" },
          ]}
          variant="line"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ranking da equipe</h2>
          <RankingTable rows={data.teamRanking} />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ranking geral</h2>
          <RankingTable rows={data.overallRanking.slice(0, 10)} />
        </div>
      </div>
    </div>
  );
}
