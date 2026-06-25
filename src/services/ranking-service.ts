import "server-only";

import { buildFilterOptions } from "@/lib/portal-scope";
import { filterAgreements, filterGoals, filterPayments } from "@/lib/portal-analytics";
import type {
  Agreement,
  DashboardFilters,
  FilterOption,
  Goal,
  Payment,
  RankingCreditorRow,
  RankingFilterOptions,
  RankingOperatorRow,
  RankingPageData,
  RankingSummaryCards,
  RankingTeamRow,
  RankingWalletRow,
  Wallet,
} from "@/types/portal";

import { getPortalContext } from "@/services/portal-service";

function getDefaultFilters(): DashboardFilters {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function safeDivide(dividend: number, divisor: number) {
  if (!divisor) {
    return 0;
  }

  return dividend / divisor;
}

function sumPaymentsValue(payments: Payment[]) {
  return payments.reduce((total, payment) => total + payment.valor_pago, 0);
}

function sumOfficeFees(payments: Payment[]) {
  return payments.reduce(
    (total, payment) => total + (payment.valor_escritorio ?? payment.valor_honorario ?? 0),
    0,
  );
}

function sumGoals(goals: Goal[]) {
  return goals.reduce((total, goal) => total + goal.valor_meta, 0);
}

function sumRevenueType(payments: Payment[], type: "NOVO" | "COLCHAO") {
  return payments.reduce(
    (total, payment) =>
      total + ((payment.tipo_receita ?? "NOVO") === type ? payment.valor_pago : 0),
    0,
  );
}

function buildWalletMaps(wallets: Wallet[]) {
  const walletById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const walletNameById = new Map(wallets.map((wallet) => [wallet.id, wallet.nome]));

  return {
    walletById,
    walletNameById,
  };
}

function buildCreditorName(wallet: Wallet | undefined) {
  return wallet?.credor ?? "Credor nao informado";
}

function buildMainWalletLabel(payments: Payment[], wallets: Wallet[]) {
  const totals = new Map<string, number>();
  const { walletNameById } = buildWalletMaps(wallets);

  for (const payment of payments) {
    if (!payment.carteira_id) {
      continue;
    }

    totals.set(
      payment.carteira_id,
      (totals.get(payment.carteira_id) ?? 0) + payment.valor_pago,
    );
  }

  const topWallet = Array.from(totals.entries()).sort((left, right) => right[1] - left[1])[0];

  if (!topWallet) {
    return "Sem carteira";
  }

  return walletNameById.get(topWallet[0]) ?? "Sem carteira";
}

function filterRankingDataset(filters: DashboardFilters) {
  return getPortalContext().then(({ profile, dataset, demoMode }) => {
    const agreements = filterAgreements(dataset, filters).filter(
      (agreement) =>
        !filters.agreementStatus || agreement.status === filters.agreementStatus,
    );
    const agreementIds = new Set(agreements.map((agreement) => agreement.id));
    const payments = filterPayments(dataset, filters).filter((payment) => {
      if (filters.revenueType && (payment.tipo_receita ?? "NOVO") !== filters.revenueType) {
        return false;
      }

      if (filters.agreementStatus) {
        return Boolean(payment.acordo_id && agreementIds.has(payment.acordo_id));
      }

      return true;
    });
    const goals = filterGoals(dataset, filters);

    return {
      profile,
      dataset,
      demoMode,
      agreements,
      payments,
      goals,
    };
  });
}

export async function listarRankingOperadores(filters: DashboardFilters = getDefaultFilters()) {
  const { dataset, agreements, payments, goals } = await filterRankingDataset(filters);
  const teamById = new Map(dataset.teams.map((team) => [team.id, team]));

  return dataset.operators
    .map((operator) => {
      const operatorPayments = payments.filter((payment) => payment.operador_id === operator.id);
      const operatorAgreements = agreements.filter(
        (agreement) => agreement.operador_id === operator.id,
      );
      const operatorGoals = goals.filter((goal) => goal.operador_id === operator.id);
      const received = sumPaymentsValue(operatorPayments);
      const goal = sumGoals(operatorGoals);

      return {
        position: 0,
        operatorId: operator.id,
        operator: operator.nome,
        team: operator.equipe_id ? teamById.get(operator.equipe_id)?.nome ?? "-" : "-",
        mainWallet: buildMainWalletLabel(operatorPayments, dataset.wallets),
        received,
        officeFees: sumOfficeFees(operatorPayments),
        agreements: operatorAgreements.length,
        writeOffs: operatorPayments.length,
        novo: sumRevenueType(operatorPayments, "NOVO"),
        colchao: sumRevenueType(operatorPayments, "COLCHAO"),
        averageTicket: safeDivide(received, operatorAgreements.length),
        goal,
        goalCompletion: safeDivide(received, goal) * 100,
      } satisfies RankingOperatorRow;
    })
    .filter((row) => row.received > 0 || row.goal > 0 || row.agreements > 0)
    .sort((left, right) => right.received - left.received || right.agreements - left.agreements)
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

export async function listarRankingEquipes(filters: DashboardFilters = getDefaultFilters()) {
  const { dataset, agreements, payments, goals } = await filterRankingDataset(filters);
  const supervisorById = new Map(dataset.profiles.map((profile) => [profile.id, profile]));

  return dataset.teams
    .map((team) => {
      const teamPayments = payments.filter((payment) => payment.equipe_id === team.id);
      const teamAgreements = agreements.filter((agreement) => agreement.equipe_id === team.id);
      const teamGoals = goals.filter((goal) => goal.equipe_id === team.id);
      const received = sumPaymentsValue(teamPayments);
      const goal = sumGoals(teamGoals);

      return {
        position: 0,
        teamId: team.id,
        team: team.nome,
        supervisor: team.supervisor_id
          ? supervisorById.get(team.supervisor_id)?.nome ?? "-"
          : "-",
        activeOperators: dataset.operators.filter(
          (operator) => operator.equipe_id === team.id && operator.ativo,
        ).length,
        received,
        officeFees: sumOfficeFees(teamPayments),
        agreements: teamAgreements.length,
        writeOffs: teamPayments.length,
        novo: sumRevenueType(teamPayments, "NOVO"),
        colchao: sumRevenueType(teamPayments, "COLCHAO"),
        goal,
        goalCompletion: safeDivide(received, goal) * 100,
      } satisfies RankingTeamRow;
    })
    .filter((row) => row.received > 0 || row.goal > 0 || row.agreements > 0)
    .sort((left, right) => right.received - left.received || right.agreements - left.agreements)
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

export async function listarRankingCarteiras(filters: DashboardFilters = getDefaultFilters()) {
  const { dataset, agreements, payments } = await filterRankingDataset(filters);

  return dataset.wallets
    .map((wallet) => {
      const walletPayments = payments.filter((payment) => payment.carteira_id === wallet.id);
      const walletAgreements = agreements.filter(
        (agreement) => agreement.carteira_id === wallet.id,
      );
      const received = sumPaymentsValue(walletPayments);

      return {
        position: 0,
        walletId: wallet.id,
        wallet: wallet.nome,
        creditor: buildCreditorName(wallet),
        received,
        officeFees: sumOfficeFees(walletPayments),
        agreements: walletAgreements.length,
        writeOffs: walletPayments.length,
        novo: sumRevenueType(walletPayments, "NOVO"),
        colchao: sumRevenueType(walletPayments, "COLCHAO"),
        averageTicket: safeDivide(received, walletAgreements.length),
      } satisfies RankingWalletRow;
    })
    .filter((row) => row.received > 0 || row.agreements > 0)
    .sort((left, right) => right.received - left.received || right.agreements - left.agreements)
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

export async function listarRankingCredores(filters: DashboardFilters = getDefaultFilters()) {
  const { dataset, payments, agreements } = await filterRankingDataset(filters);

  const creditorKeys = new Map<string, { id: string | null; name: string }>();

  for (const creditor of dataset.creditors) {
    creditorKeys.set(creditor.nome, {
      id: creditor.id,
      name: creditor.nome,
    });
  }

  for (const wallet of dataset.wallets) {
    if (!creditorKeys.has(wallet.credor)) {
      creditorKeys.set(wallet.credor, {
        id: wallet.credor_id ?? null,
        name: wallet.credor,
      });
    }
  }

  return Array.from(creditorKeys.values())
    .map((creditor) => {
      const linkedWallets = dataset.wallets.filter(
        (wallet) =>
          wallet.credor_id === creditor.id || wallet.credor === creditor.name,
      );
      const linkedWalletIds = new Set(linkedWallets.map((wallet) => wallet.id));
      const creditorPayments = payments.filter((payment) =>
        payment.carteira_id ? linkedWalletIds.has(payment.carteira_id) : false,
      );
      const creditorAgreements = agreements.filter((agreement) =>
        agreement.carteira_id ? linkedWalletIds.has(agreement.carteira_id) : false,
      );
      const received = sumPaymentsValue(creditorPayments);

      return {
        position: 0,
        creditorId: creditor.id,
        creditor: creditor.name,
        linkedWallets: linkedWallets.length,
        received,
        officeFees: sumOfficeFees(creditorPayments),
        agreements: creditorAgreements.length,
        writeOffs: creditorPayments.length,
        novo: sumRevenueType(creditorPayments, "NOVO"),
        colchao: sumRevenueType(creditorPayments, "COLCHAO"),
        averageTicket: safeDivide(received, creditorAgreements.length),
      } satisfies RankingCreditorRow;
    })
    .filter((row) => row.received > 0 || row.agreements > 0 || row.linkedWallets > 0)
    .sort((left, right) => right.received - left.received || right.agreements - left.agreements)
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

function buildRankingOptions(): Promise<RankingFilterOptions> {
  return getPortalContext().then(({ dataset }) => {
    const baseOptions = buildFilterOptions(dataset);
    const revenueTypes: FilterOption[] = [
      { value: "NOVO", label: "NOVO" },
      { value: "COLCHAO", label: "COLCHAO" },
    ];
    const agreementStatuses: FilterOption[] = Array.from(
      new Set(dataset.agreements.map((agreement) => agreement.status).filter(Boolean)),
    )
      .sort((left, right) => left.localeCompare(right))
      .map((status) => ({
        value: status,
        label: status,
      }));

    return {
      ...baseOptions,
      revenueTypes,
      agreementStatuses,
    };
  });
}

function buildRankingSummary(payments: Payment[], agreements: Agreement[], goals: Goal[]) {
  const totalReceived = sumPaymentsValue(payments);
  const totalGoal = sumGoals(goals);

  return {
    totalReceived,
    totalOfficeFees: sumOfficeFees(payments),
    totalWriteOffs: payments.length,
    totalAgreements: agreements.length,
    totalGoal,
    goalCompletion: safeDivide(totalReceived, totalGoal) * 100,
  } satisfies RankingSummaryCards;
}

export async function getRankingPageData(
  filters: DashboardFilters,
): Promise<RankingPageData> {
  const [{ profile, demoMode, payments, agreements, goals }, options, operatorRanking, teamRanking, walletRanking, creditorRanking] =
    await Promise.all([
      filterRankingDataset(filters),
      buildRankingOptions(),
      listarRankingOperadores(filters),
      listarRankingEquipes(filters),
      listarRankingCarteiras(filters),
      listarRankingCredores(filters),
    ]);

  return {
    profile,
    filters,
    options,
    summary: buildRankingSummary(payments, agreements, goals),
    operatorRanking,
    teamRanking,
    walletRanking,
    creditorRanking,
    demoMode,
  };
}
