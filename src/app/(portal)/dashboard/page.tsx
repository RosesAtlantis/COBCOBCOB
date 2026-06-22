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
import { PermissionGuard } from "@/components/permission-guard";
import { RankingTable } from "@/components/ranking-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
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

      <section className="space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Painel executivo
            </p>
            <h2 className="text-xl font-semibold tracking-tight">Indicadores do periodo</h2>
            <p className="text-sm text-muted-foreground">
              Leitura consolidada da operacao para acompanhamento diario e mensal.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-md border-border/80 bg-card px-3 py-1">
            Atualizado conforme filtros ativos
          </Badge>
        </div>

        <div className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Arrecadacao do mes"
            value={formatCurrency(data.summary.totalCollected)}
            subtitle={`Meta consolidada: ${formatCurrency(data.summary.totalGoal)}`}
            delta={`${formatPercent(data.summary.monthlyDelta)} vs. periodo anterior`}
            icon={CircleDollarSign}
            accent="primary"
          />
          <DashboardCard
            title="Meta mensal"
            value={formatCurrency(data.summary.totalGoal)}
            subtitle="Base utilizada para comparacao do ciclo vigente."
            icon={Target}
            accent="warning"
          />
          <DashboardCard
            title="Percentual da meta"
            value={formatPercent(data.summary.goalCompletion)}
            subtitle={
              topWallet ? `Carteira lider em aderencia: ${topWallet.label}` : "Sem carteira lider"
            }
            icon={Target}
            accent="warning"
          />
          <DashboardCard
            title="Acordos"
            value={formatNumber(data.summary.agreementCount)}
            subtitle="Quantidade total formalizada no recorte atual."
            icon={HandCoins}
            accent="success"
          />
          <DashboardCard
            title="Ticket medio"
            value={formatCurrency(data.summary.averageTicket)}
            subtitle="Valor medio por acordo consolidado no periodo."
            icon={HandCoins}
            accent="success"
          />
          <DashboardCard
            title="Melhor operador"
            value={formatCurrency(topOperator?.value ?? 0)}
            subtitle={topOperator?.label ?? "Sem destaque no periodo"}
            delta={topOperator?.subtitle}
            icon={Trophy}
            accent="info"
          />
          <DashboardCard
            title="Melhor equipe"
            value={formatCurrency(topTeam?.value ?? 0)}
            subtitle={topTeam?.label ?? "Sem destaque no periodo"}
            delta={topTeam?.subtitle}
            icon={Users}
            accent="info"
          />
          <DashboardCard
            title="Melhor carteira"
            value={formatCurrency(topWallet?.value ?? 0)}
            subtitle={topWallet?.label ?? "Sem destaque no periodo"}
            delta={topWallet?.subtitle}
            icon={BriefcaseBusiness}
            accent="primary"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartCard
          title="Evolucao diaria de arrecadacao"
          description="Arrecadacao e volume de acordos acompanhados no recorte selecionado."
          data={data.dailyEvolution}
          xKey="label"
          series={[
            { key: "arrecadacao", label: "Arrecadacao", color: "#7aa2f7" },
            { key: "acordos", label: "Acordos", color: "#6bc4c8" },
          ]}
          variant="line"
        />

        <div className="dashboard-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Resumo executivo
              </p>
              <h3 className="mt-2 text-lg font-semibold">Leituras rapidas do periodo</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Destaques operacionais para apoio da lideranca e do financeiro.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              Monitoramento
            </Badge>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="dashboard-subtle flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Melhor operador
                </p>
                <p className="mt-2 text-base font-semibold">
                  {topOperator?.label ?? "Sem destaque"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topOperator?.subtitle ?? "Aguardando movimentacao"}
                </p>
              </div>
              <p className="text-right text-lg font-semibold">
                {formatCurrency(topOperator?.value ?? 0)}
              </p>
            </div>

            <div className="dashboard-subtle flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Melhor equipe
                </p>
                <p className="mt-2 text-base font-semibold">{topTeam?.label ?? "Sem destaque"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{topTeam?.subtitle ?? "-"}</p>
              </div>
              <p className="text-right text-lg font-semibold">
                {formatCurrency(topTeam?.value ?? 0)}
              </p>
            </div>

            <div className="dashboard-subtle flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Melhor carteira
                </p>
                <p className="mt-2 text-base font-semibold">
                  {topWallet?.label ?? "Sem destaque"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{topWallet?.subtitle ?? "-"}</p>
              </div>
              <p className="text-right text-lg font-semibold">
                {formatCurrency(topWallet?.value ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="dashboard-subtle p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Variacao mensal
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatPercent(data.summary.monthlyDelta)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Comparativo frente ao periodo imediatamente anterior.
              </p>
            </div>
            <div className="dashboard-subtle p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ticket medio
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatCurrency(data.summary.averageTicket)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Indicador de eficiencia dos acordos formalizados.
              </p>
            </div>
          </div>

          <PermissionGuard
            role={data.profile.perfil}
            allowedRoles={["admin", "gerente", "financeiro"]}
          >
            <div className="mt-5 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2 text-sky-300">
                  <BriefcaseBusiness className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Visao financeira ampliada</p>
                  <p className="text-sm text-muted-foreground">
                    Perfil com acesso ampliado a historicos, metas e consolidacoes
                    financeiras do portal.
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
            { key: "arrecadacao", label: "Arrecadacao", color: "#7aa2f7" },
            { key: "meta", label: "Meta", color: "#d3a66b" },
          ]}
          variant="bar"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Top 10 operadores</h2>
              <p className="text-sm text-muted-foreground">
                Ranking atualizado conforme os filtros globais aplicados ao painel.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              {formatNumber(data.operatorRanking.length)} operadores
            </Badge>
          </div>
          <RankingTable rows={data.operatorRanking.slice(0, 10)} />
        </div>
      </section>
    </div>
  );
}
