import { ChartCard } from "@/components/chart-card";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import { parseDashboardFilters } from "@/lib/portal-filters";
import { getTeamPageData } from "@/services/portal-service";

interface TeamsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getTeamPageData(filters);

  return (
    <div className="space-y-6">
      <FilterBar filters={data.filters} options={data.options} />

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="dashboard-surface p-5">
          <h2 className="text-lg font-semibold">Destaques por equipe</h2>
          <div className="mt-5 space-y-4">
            {data.teams.slice(0, 3).map((team) => (
              <div
                key={team.teamId}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{team.team}</p>
                    <p className="text-sm text-muted-foreground">
                      Supervisor: {team.supervisor}
                    </p>
                  </div>
                  <p className="text-sm text-primary">
                    {formatPercent(team.goalCompletion)}
                  </p>
                </div>
                <p className="mt-4 text-2xl font-semibold">
                  {formatCurrency(team.collected)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Melhor operador: {team.bestOperator}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          title="Evolucao das equipes"
          description="Panorama mensal da arrecadacao consolidada."
          data={data.evolution}
          xKey="label"
          series={[{ key: "arrecadacao", label: "Arrecadacao", color: "#f2c14e" }]}
          variant="line"
        />
      </div>

      <DataTable
        rows={data.teams}
        columns={[
          { key: "team", header: "Equipe" },
          { key: "supervisor", header: "Supervisor" },
          {
            key: "operators",
            header: "Operadores",
            align: "right",
            render: (row) => formatNumber(row.operators),
          },
          {
            key: "collected",
            header: "Arrecadacao",
            align: "right",
            render: (row) => formatCurrency(row.collected),
          },
          {
            key: "goal",
            header: "Meta",
            align: "right",
            render: (row) => formatCurrency(row.goal),
          },
          {
            key: "goalCompletion",
            header: "% Meta",
            align: "right",
            render: (row) => formatPercent(row.goalCompletion),
          },
          { key: "bestOperator", header: "Melhor operador" },
        ]}
      />
    </div>
  );
}
