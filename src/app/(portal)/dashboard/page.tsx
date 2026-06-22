import {
  BriefcaseBusiness,
  CircleDollarSign,
  HandCoins,
  Target,
  Trophy,
  Users,
} from "lucide-react";

import { ChartCard } from "@/components/chart-card";
import { DashboardCard } from "@/components/dashboard-card";
import { FilterBar } from "@/components/filter-bar";
import { RankingTable } from "@/components/ranking-table";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/permission-guard";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import { parseDashboardFilters } from "@/lib/portal-filters";
import { getDashboardPageData } from "@/services/portal-service";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getDashboardPageData(filters);
  const topOperator = data.summary.bestOperator;
  const topTeam = data.summary.bestTeam;
  const topWallet = data.summary.bestWallet;

  return (
    <div className="space-y-6">
      <FilterBar filters={data.filters} options={data.options} />

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Arrecadacao do periodo"
          value={formatCurrency(data.summary.totalCollected)}
          subtitle={`Meta consolidada: ${formatCurrency(data.summary.totalGoal)}`}
          delta={`${formatPercent(data.summary.monthlyDelta)} vs. periodo anterior`}
          icon={CircleDollarSign}
          accent="primary"
        />
        <DashboardCard
          title="Atingimento da meta"
          value={formatPercent(data.summary.goalCompletion)}
          subtitle={topWallet ? `Carteira lider: ${topWallet.label}` : "Sem carteira lider"}
          icon={Target}
          accent="warning"
        />
        <DashboardCard
          title="Quantidade de acordos"
          value={formatNumber(data.summary.agreementCount)}
          subtitle={`Ticket medio: ${formatCurrency(data.summary.averageTicket)}`}
          icon={HandCoins}
          accent="success"
        />
        <DashboardCard
          title="Melhor equipe"
          value={topTeam?.label ?? "Sem destaque"}
          subtitle={topTeam ? formatCurrency(topTeam.value) : "Ainda sem arrecadacao"}
          icon={Users}
          accent="info"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartCard
          title="Evolucao diaria de arrecadacao"
          description="Arrecadacao e quantidade de acordos no recorte selecionado."
          data={data.dailyEvolution}
          xKey="label"
          series={[
            { key: "arrecadacao", label: "Arrecadacao", color: "#f2c14e" },
            { key: "acordos", label: "Acordos", color: "#4ea8de" },
          ]}
          variant="line"
        />

        <div className="grid gap-6">
          <div className="dashboard-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Melhor operador</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {topOperator?.label ?? "Sem destaque"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topOperator?.subtitle ?? "Aguardando movimentacao"}
                </p>
              </div>
              <Badge className="bg-primary/12 text-primary">
                <Trophy className="mr-1 size-3.5" />
                Lider
              </Badge>
            </div>
            <p className="mt-6 text-3xl font-semibold">
              {formatCurrency(topOperator?.value ?? 0)}
            </p>
          </div>

          <div className="dashboard-surface p-5">
            <p className="text-sm font-medium text-muted-foreground">Melhor carteira</p>
            <h3 className="mt-2 text-xl font-semibold">{topWallet?.label ?? "Sem destaque"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{topWallet?.subtitle ?? "-"}</p>
            <p className="mt-6 text-3xl font-semibold">
              {formatCurrency(topWallet?.value ?? 0)}
            </p>
          </div>

          <PermissionGuard
            role={data.profile.perfil}
            allowedRoles={["admin", "gerente", "financeiro"]}
          >
            <div className="dashboard-surface p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-500/12 p-2.5 text-sky-300">
                  <BriefcaseBusiness className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Visao financeira ampliada</p>
                  <p className="text-sm text-muted-foreground">
                    Perfil com acesso amplo a dashboards e historico financeiro.
                  </p>
                </div>
              </div>
            </div>
          </PermissionGuard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartCard
          title="Comparativo mensal"
          description="Arrecadacao e meta consolidada nos ultimos meses."
          data={data.monthlyEvolution}
          xKey="label"
          series={[
            { key: "arrecadacao", label: "Arrecadacao", color: "#f2c14e" },
            { key: "meta", label: "Meta", color: "#5271ff" },
          ]}
          variant="bar"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Top 10 operadores</h2>
              <p className="text-sm text-muted-foreground">
                Ranking atualizado conforme os filtros globais aplicados.
              </p>
            </div>
          </div>
          <RankingTable rows={data.operatorRanking.slice(0, 10)} />
        </div>
      </section>
    </div>
  );
}
