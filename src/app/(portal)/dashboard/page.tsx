import {
  CircleDollarSign,
  HandCoins,
  Target,
  TrendingUp,
  Users,
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

  if (data.summary.remainingGoal > 0) {
    attentionItems.push({
      title: "Meta do periodo ainda nao atingida",
      description: `Faltam ${formatCurrency(data.summary.remainingGoal)} para fechar o periodo em 100% da meta.`,
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
        key={JSON.stringify(data.filters)}
        filters={data.filters}
        options={data.options}
        title="Painel de cobranca"
        description="Acompanhe pagamentos, saldo negociado, meta, ritmo diario e previsao de fechamento."
        showCreditorFilter
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardCard
          title="Pagamentos no periodo"
          value={formatCurrency(data.summary.totalCollected)}
          subtitle={`${formatNumber(data.summary.paymentCount)} pagamento(s) validos no recorte.`}
          delta={`${formatSignedPercent(data.summary.monthlyDelta)} vs mes anterior`}
          icon={CircleDollarSign}
          accent="primary"
        />
        <DashboardCard
          title="A receber"
          value={formatCurrency(data.summary.receivableTotal)}
          subtitle="Saldo ainda em aberto nos acordos filtrados."
          icon={WalletCards}
          accent="info"
        />
        <DashboardCard
          title="Meta atingida"
          value={formatPercent(data.summary.goalCompletion)}
          subtitle={`Meta base de ${formatCurrency(data.summary.totalGoal)}.`}
          icon={Target}
          accent="warning"
        />
        <DashboardCard
          title="Falta para meta"
          value={formatCurrency(data.summary.remainingGoal)}
          subtitle={
            data.summary.remainingGoal > 0
              ? `${formatCurrency(data.summary.requiredDailyPace)} por dia para bater a meta.`
              : "Meta do periodo atingida."
          }
          icon={HandCoins}
          accent="warning"
        />
        <DashboardCard
          title="Previsao de fechamento"
          value={formatCurrency(data.summary.projectedMonthEnd)}
          subtitle="Projecao pela media diaria do periodo."
          icon={TrendingUp}
          accent="success"
        />
        <DashboardCard
          title="Media por operador/dia"
          value={formatCurrency(data.summary.averagePerOperatorDay)}
          subtitle={`${formatNumber(data.summary.activeOperators)} operador(es) com carteira no recorte.`}
          icon={Users}
          accent="info"
        />
      </section>

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-5">
        <div className="dashboard-stat">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recebido hoje
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(data.summary.collectedToday)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Producao confirmada na data atual.
          </p>
        </div>
        <div className="dashboard-stat">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Mes passado
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(data.summary.lastMonthCollected)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Base para o comparativo mensal.
          </p>
        </div>
        <div className="dashboard-stat">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Honorarios escritorio
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(data.summary.officeFeesCollected)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Valor de escritorio consolidado em pagamentos.
          </p>
        </div>
        <div className="dashboard-stat">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ticket medio
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(data.summary.averageTicket)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Media por acordo fechado no recorte.
          </p>
        </div>
        <div className="dashboard-stat">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Acordos no periodo
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatNumber(data.summary.agreementCount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Negociacoes registradas na janela filtrada.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {data.dailyEvolution.length > 0 ? (
          <ChartCard
            title="Evolucao diaria da cobranca"
            description="Arrecadacao confirmada por dia no recorte selecionado."
            data={data.dailyEvolution}
            xKey="label"
            series={[{ key: "arrecadacao", label: "Pagamentos", color: "#7aa2f7" }]}
            variant="area"
            height={320}
          />
        ) : (
          <div className="dashboard-surface p-5">
            <p className="text-sm font-semibold">Evolucao diaria da cobranca</p>
            <div className="dashboard-subtle mt-5 flex min-h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Ainda nao ha movimentacao suficiente para exibir a evolucao do periodo.
            </div>
          </div>
        )}

        {data.monthlyEvolution.length > 0 ? (
          <ChartCard
            title="Arrecadacao x meta"
            description="Comparativo mensal para ritmo de cobranca e fechamento."
            data={data.monthlyEvolution}
            xKey="label"
            series={[
              { key: "arrecadacao", label: "Arrecadacao", color: "#0f766e" },
              { key: "meta", label: "Meta", color: "#f59e0b" },
            ]}
            variant="bar"
            height={320}
          />
        ) : (
          <div className="dashboard-surface p-5">
            <p className="text-sm font-semibold">Arrecadacao x meta</p>
            <div className="dashboard-subtle mt-5 flex min-h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Ainda nao ha historico suficiente para comparar arrecadacao e meta.
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="dashboard-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Ranking resumido
              </p>
              <h2 className="mt-2 text-lg font-semibold">Top operadores</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quem puxou a cobranca e quanto da meta ja foi entregue.
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
                      <p className="truncate text-xs text-muted-foreground">
                        {row.team} / {row.wallet}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(row.collected)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(row.goalCompletion)} da meta
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

        <div className="dashboard-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Carteiras em destaque
              </p>
              <h2 className="mt-2 text-lg font-semibold">Top carteiras</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Onde a cobranca mais converteu no periodo.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
              Ate 5 carteiras
            </Badge>
          </div>

          {featuredWallets.length > 0 ? (
            <div className="mt-5 space-y-3">
              {featuredWallets.map((wallet) => {
                const participation =
                  safeDivide(wallet.collected, data.summary.totalCollected) * 100;

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
      </section>

      <section className="dashboard-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pontos de atencao
            </p>
            <h2 className="mt-2 text-lg font-semibold">Leitura rapida do gestor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Alertas operacionais para agir no dia sem perder tempo.
            </p>
          </div>
          <Badge variant="outline" className="rounded-md border-border/80 bg-card px-3 py-1">
            {attentionItems.length > 0 ? attentionItems.length : "Sem alertas"}
          </Badge>
        </div>

        {attentionItems.length > 0 ? (
          <div className="mt-5 grid gap-3 xl:grid-cols-3">
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
            Nenhum ponto critico identificado no recorte atual. O painel segue estavel
            para acompanhamento da cobranca.
          </div>
        )}
      </section>
    </div>
  );
}
