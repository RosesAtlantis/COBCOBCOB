import {
  CircleDollarSign,
  HandCoins,
  Target,
  WalletCards,
} from "lucide-react";

import { ChartCard } from "@/components/chart-card";
import { DashboardCard } from "@/components/dashboard-card";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { parseDashboardFilters } from "@/lib/portal-filters";
import { getDashboardPageData } from "@/services/portal-service";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface AttentionItem {
  title: string;
  description: string;
  tone: "critical" | "warning" | "info";
}

const attentionToneStyles: Record<AttentionItem["tone"], string> = {
  critical: "border-destructive/20 bg-destructive/6",
  warning: "border-amber-500/20 bg-amber-500/8",
  info: "border-sky-500/20 bg-sky-500/8",
};

function formatSignedPercent(value: number) {
  const formatted = formatPercent(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function safeDivide(dividend: number, divisor: number) {
  if (!divisor) {
    return 0;
  }

  return dividend / divisor;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getDashboardPageData(filters);

  const topRanking = data.operatorRanking.slice(0, 5);
  const featuredWallets = data.walletPerformance.slice(0, 5);
  const goalGap = Math.max(data.summary.totalGoal - data.summary.totalCollected, 0);

  const decliningTeam = data.teamPerformance
    .filter((team) => team.evolution < 0)
    .sort((left, right) => left.evolution - right.evolution)[0];

  const lowRecoveryWallet = data.walletPerformance
    .filter((wallet) => wallet.agreements > 0 && wallet.recoveryRate < 25)
    .sort((left, right) => left.recoveryRate - right.recoveryRate)[0];

  const lowGoalOperator = data.operatorRanking
    .filter((operator) => operator.goal > 0 && operator.goalCompletion < 60)
    .sort((left, right) => left.goalCompletion - right.goalCompletion)[0];

  const attentionItems: AttentionItem[] = [];

  if (goalGap > 0) {
    attentionItems.push({
      title: "Meta do periodo ainda nao atingida",
      description: `Faltam ${formatCurrency(goalGap)} para fechar o mes em 100% da meta.`,
      tone: "critical",
    });
  }

  if (decliningTeam) {
    attentionItems.push({
      title: `${decliningTeam.team} em queda no comparativo mensal`,
      description: `Variacao de ${formatSignedPercent(decliningTeam.evolution)} frente ao mes anterior.`,
      tone: "warning",
    });
  }

  if (lowRecoveryWallet) {
    attentionItems.push({
      title: `${lowRecoveryWallet.wallet} com baixa recuperacao`,
      description: `Recuperacao de ${formatPercent(lowRecoveryWallet.recoveryRate)} no recorte selecionado.`,
      tone: "warning",
    });
  }

  if (lowGoalOperator) {
    attentionItems.push({
      title: `${lowGoalOperator.operator} abaixo da meta esperada`,
      description: `${formatPercent(lowGoalOperator.goalCompletion)} da meta atingida em ${lowGoalOperator.team}.`,
      tone: "info",
    });
  }

  return (
    <div className="space-y-6">
      <FilterBar
        filters={data.filters}
        options={data.options}
        title="Filtros principais"
        description="Mes, ano, equipe e carteira para a visao geral."
        showDateRange={false}
        showOperatorFilter={false}
        showCreditorFilter={false}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardCard
          title="Arrecadacao do mes"
          value={formatCurrency(data.summary.totalCollected)}
          subtitle="Valor pago consolidado no recorte atual."
          delta={`${formatSignedPercent(data.summary.monthlyDelta)} vs mes anterior`}
          icon={CircleDollarSign}
          accent="primary"
        />
        <DashboardCard
          title="Meta do mes"
          value={formatCurrency(data.summary.totalGoal)}
          subtitle="Base mensal considerada para comparacao."
          icon={Target}
          accent="warning"
        />
        <DashboardCard
          title="Atingimento"
          value={formatPercent(data.summary.goalCompletion)}
          subtitle={
            goalGap > 0
              ? `Faltam ${formatCurrency(goalGap)} para a meta.`
              : "Meta do periodo atingida."
          }
          icon={Target}
          accent="warning"
        />
        <DashboardCard
          title="Acordos"
          value={formatNumber(data.summary.agreementCount)}
          subtitle="Quantidade formalizada no recorte atual."
          icon={HandCoins}
          accent="success"
        />
        <DashboardCard
          title="Ticket medio"
          value={formatCurrency(data.summary.averageTicket)}
          subtitle="Valor medio por acordo fechado."
          icon={WalletCards}
          accent="info"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        {data.dailyEvolution.length > 0 ? (
          <ChartCard
            title="Evolucao da arrecadacao"
            description="Leitura diaria da arrecadacao no periodo selecionado."
            data={data.dailyEvolution}
            xKey="label"
            series={[{ key: "arrecadacao", label: "Arrecadacao", color: "#7aa2f7" }]}
            variant="area"
            height={320}
          />
        ) : (
          <div className="dashboard-surface p-5">
            <p className="text-sm font-semibold">Evolucao da arrecadacao</p>
            <div className="dashboard-subtle mt-5 flex min-h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Ainda nao ha movimentacao suficiente para exibir a evolucao do periodo.
            </div>
          </div>
        )}

        <div className="dashboard-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Ranking resumido
              </p>
              <h2 className="mt-2 text-lg font-semibold">Top 5 operadores</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Leitura rapida de quem mais performou no periodo.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              {topRanking.length} exibidos
            </Badge>
          </div>

          {topRanking.length > 0 ? (
            <div className="mt-5 space-y-3">
              {topRanking.map((row) => (
                <div
                  key={row.operatorId}
                  className="dashboard-subtle flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <Badge
                      variant={row.position <= 3 ? "default" : "outline"}
                      className="rounded-md px-2 py-0.5 text-[11px]"
                    >
                      #{row.position}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.operator}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.team}</p>
                    </div>
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
          ) : (
            <div className="dashboard-subtle mt-5 p-4 text-sm text-muted-foreground">
              Nenhum operador com producao no recorte selecionado.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="dashboard-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Carteiras em destaque
              </p>
              <h2 className="mt-2 text-lg font-semibold">Top carteiras do periodo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Participacao sobre a arrecadacao total filtrada.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              Ate 5 carteiras
            </Badge>
          </div>

          {featuredWallets.length > 0 ? (
            <div className="mt-5 space-y-3">
              {featuredWallets.map((wallet) => {
                const participation = safeDivide(
                  wallet.collected,
                  data.summary.totalCollected,
                ) * 100;

                return (
                  <div
                    key={wallet.walletId}
                    className="dashboard-subtle flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{wallet.wallet}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {wallet.creditor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(wallet.collected)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(participation)} da arrecadacao
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-subtle mt-5 p-4 text-sm text-muted-foreground">
              Nenhuma carteira com arrecadacao registrada no recorte atual.
            </div>
          )}
        </div>

        <div className="dashboard-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Pontos de atencao
              </p>
              <h2 className="mt-2 text-lg font-semibold">Alertas operacionais</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sinais objetivos para acompanhamento rapido do gestor.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              {attentionItems.length > 0 ? attentionItems.length : "Sem alertas"}
            </Badge>
          </div>

          {attentionItems.length > 0 ? (
            <div className="mt-5 space-y-3">
              {attentionItems.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-xl border p-4 ${attentionToneStyles[item.tone]}`}
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-subtle mt-5 p-4 text-sm text-muted-foreground">
              Nenhum ponto critico identificado no recorte atual. O painel segue
              estavel para acompanhamento executivo.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
