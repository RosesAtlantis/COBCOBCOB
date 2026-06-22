import { ChartCard } from "@/components/chart-card";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Gestao de equipes
              </p>
              <h2 className="mt-2 text-lg font-semibold">Destaques por equipe</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consolidado das liderancas com melhor entrega no periodo atual.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              Top 3
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {data.teams.slice(0, 3).map((team) => (
              <div key={team.teamId} className="dashboard-subtle p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{team.team}</p>
                    <p className="text-sm text-muted-foreground">
                      Supervisor: {team.supervisor}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-md border-border/80 px-2 py-0.5">
                    {formatPercent(team.goalCompletion)}
                  </Badge>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {formatCurrency(team.collected)}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Melhor operador: {team.bestOperator}</span>
                  <span>{formatNumber(team.operators)} operadores</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          title="Evolucao das equipes"
          description="Panorama mensal da arrecadacao consolidada."
          data={data.evolution}
          xKey="label"
          series={[{ key: "arrecadacao", label: "Arrecadacao", color: "#6bc4c8" }]}
          variant="line"
        />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Visao detalhada das equipes</h2>
          <p className="text-sm text-muted-foreground">
            Dados completos para comparacao de supervisao, meta e produtividade.
          </p>
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
      </section>
    </div>
  );
}
