import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import type {
  Agreement,
  DashboardFilters,
  DashboardSummary,
  Goal,
  OperatorOverview,
  OperatorRankingRow,
  Payment,
  PortalDataset,
  RevenuePoint,
  TeamPerformanceRow,
  Wallet,
  WalletPerformanceRow,
} from "@/types/portal";

function safeDivide(dividend: number, divisor: number) {
  if (!divisor) {
    return 0;
  }

  return dividend / divisor;
}

function buildWalletMap(wallets: Wallet[]) {
  return new Map(wallets.map((wallet) => [wallet.id, wallet]));
}

function resolvePeriodRange(filters: DashboardFilters) {
  const baseMonthStart = startOfMonth(new Date(filters.year, filters.month - 1, 1));
  const start = filters.startDate
    ? startOfDay(parseISO(filters.startDate))
    : baseMonthStart;
  const end = filters.endDate
    ? endOfDay(parseISO(filters.endDate))
    : endOfMonth(baseMonthStart);

  return {
    start,
    end,
  };
}

function inDateRange(dateValue: string, filters: DashboardFilters) {
  const date = parseISO(dateValue);
  const { start, end } = resolvePeriodRange(filters);

  return date >= start && date <= end;
}

function recordMatchesEntityFilter(
  teamId: string | null,
  operatorId: string | null,
  walletId: string | null,
  filters: DashboardFilters,
  walletMap: Map<string, Wallet>,
) {
  if (filters.teamId && teamId !== filters.teamId) {
    return false;
  }

  if (filters.operatorId && operatorId !== filters.operatorId) {
    return false;
  }

  if (filters.walletId && walletId !== filters.walletId) {
    return false;
  }

  if (filters.creditor && walletId) {
    return walletMap.get(walletId)?.credor === filters.creditor;
  }

  return true;
}

export function filterPayments(dataset: PortalDataset, filters: DashboardFilters) {
  const walletMap = buildWalletMap(dataset.wallets);

  return dataset.payments.filter(
    (payment) =>
      !payment.estornado &&
      inDateRange(payment.data_pagamento, filters) &&
      (!filters.revenueType || payment.tipo_receita === filters.revenueType) &&
      recordMatchesEntityFilter(
        payment.equipe_id,
        payment.operador_id,
        payment.carteira_id,
        filters,
        walletMap,
      ),
  );
}

export function filterAgreements(dataset: PortalDataset, filters: DashboardFilters) {
  const walletMap = buildWalletMap(dataset.wallets);

  return dataset.agreements.filter(
    (agreement) =>
      inDateRange(agreement.data_acordo, filters) &&
      (!filters.agreementStatus || agreement.status === filters.agreementStatus) &&
      recordMatchesEntityFilter(
        agreement.equipe_id,
        agreement.operador_id,
        agreement.carteira_id,
        filters,
        walletMap,
      ),
  );
}

export function filterGoals(dataset: PortalDataset, filters: DashboardFilters) {
  const walletMap = buildWalletMap(dataset.wallets);
  const creditorById = new Map(
    dataset.creditors.map((creditor) => [creditor.id, creditor.nome]),
  );

  return dataset.goals.filter((goal) => {
    if (!goal.ativo) {
      return false;
    }

    if (goal.mes !== filters.month || goal.ano !== filters.year) {
      return false;
    }

    if (filters.teamId && goal.equipe_id !== filters.teamId) {
      return false;
    }

    if (filters.operatorId && goal.operador_id !== filters.operatorId) {
      return false;
    }

    if (filters.walletId && goal.carteira_id !== filters.walletId) {
      return false;
    }

    if (filters.creditor) {
      const walletCreditor = goal.carteira_id
        ? walletMap.get(goal.carteira_id)?.credor ?? null
        : null;
      const directCreditor = goal.credor_id
        ? creditorById.get(goal.credor_id) ?? null
        : null;

      if (walletCreditor !== filters.creditor && directCreditor !== filters.creditor) {
        return false;
      }
    }

    return true;
  });
}

function sumPayments(payments: Payment[]) {
  return payments.reduce((total, item) => total + item.valor_pago, 0);
}

function sumGoals(goals: Goal[]) {
  return goals.reduce((total, item) => total + item.valor_meta, 0);
}

function countAgreements(agreements: Agreement[]) {
  return agreements.length;
}

function buildCurrentPeriodProgress(filters: DashboardFilters) {
  const today = startOfDay(new Date());
  const { start, end } = resolvePeriodRange(filters);
  const totalDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);

  if (today < start) {
    return {
      elapsedDays: 0,
      remainingDays: totalDays,
      totalDays,
    };
  }

  const effectiveEnd = today > end ? end : today;
  const elapsedDays = Math.max(differenceInCalendarDays(effectiveEnd, start) + 1, 0);

  return {
    elapsedDays,
    remainingDays: Math.max(totalDays - elapsedDays, 0),
    totalDays,
  };
}

function countActiveOperators(
  dataset: PortalDataset,
  filters: DashboardFilters,
  payments: Payment[],
  agreements: Agreement[],
) {
  const operatorIds = new Set(
    [...payments, ...agreements]
      .map((item) => item.operador_id)
      .filter((value): value is string => Boolean(value)),
  );

  if (operatorIds.size > 0) {
    return operatorIds.size;
  }

  return dataset.operators.filter((operator) => {
    if (filters.operatorId) {
      return operator.id === filters.operatorId;
    }

    if (filters.teamId) {
      return operator.equipe_id === filters.teamId;
    }

    return true;
  }).length;
}

function buildTopWalletLabel(
  payments: Payment[],
  walletMap: Map<string, Wallet>,
) {
  const byWallet = new Map<string, number>();

  payments.forEach((payment) => {
    if (!payment.carteira_id) {
      return;
    }

    byWallet.set(
      payment.carteira_id,
      (byWallet.get(payment.carteira_id) ?? 0) + payment.valor_pago,
    );
  });

  const topEntry = Array.from(byWallet.entries()).sort((left, right) => {
    return right[1] - left[1];
  })[0];

  if (!topEntry) {
    return {
      wallet: "Sem carteira",
      creditor: "Nao identificado",
    };
  }

  const wallet = walletMap.get(topEntry[0]);

  return {
    wallet: wallet?.nome ?? "Sem carteira",
    creditor: wallet?.credor ?? "Nao identificado",
  };
}

export function buildOperatorRanking(
  dataset: PortalDataset,
  filters: DashboardFilters,
) {
  const payments = filterPayments(dataset, filters);
  const agreements = filterAgreements(dataset, filters);
  const goals = filterGoals(dataset, filters);
  const teamMap = new Map(dataset.teams.map((team) => [team.id, team]));
  const walletMap = buildWalletMap(dataset.wallets);

  const rows = dataset.operators
    .filter((operator) => !filters.teamId || operator.equipe_id === filters.teamId)
    .filter((operator) => !filters.operatorId || operator.id === filters.operatorId)
    .map((operator) => {
      const operatorPayments = payments.filter(
        (payment) => payment.operador_id === operator.id,
      );
      const operatorAgreements = agreements.filter(
        (agreement) => agreement.operador_id === operator.id,
      );
      const operatorGoals = goals.filter((goal) => goal.operador_id === operator.id);
      const topWallet = buildTopWalletLabel(operatorPayments, walletMap);
      const collected = sumPayments(operatorPayments);
      const agreementCount = countAgreements(operatorAgreements);
      const goalValue = sumGoals(operatorGoals);

      return {
        position: 0,
        operatorId: operator.id,
        operator: operator.nome,
        team: operator.equipe_id ? teamMap.get(operator.equipe_id)?.nome ?? "-" : "-",
        wallet: topWallet.wallet,
        creditor: topWallet.creditor,
        collected,
        agreements: agreementCount,
        goal: goalValue,
        goalCompletion: safeDivide(collected, goalValue) * 100,
        averageTicket: safeDivide(collected, agreementCount),
      } satisfies OperatorRankingRow;
    })
    .sort((left, right) => right.collected - left.collected)
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));

  return rows.filter(
    (row) => row.collected > 0 || row.goal > 0 || row.agreements > 0,
  );
}

export function buildTeamPerformance(
  dataset: PortalDataset,
  filters: DashboardFilters,
) {
  const ranking = buildOperatorRanking(dataset, filters);
  const payments = filterPayments(dataset, filters);
  const goals = filterGoals(dataset, filters);
  const supervisors = new Map(dataset.profiles.map((profile) => [profile.id, profile]));

  return dataset.teams
    .filter((team) => !filters.teamId || team.id === filters.teamId)
    .map((team) => {
      const teamOperators = dataset.operators.filter(
        (operator) => operator.equipe_id === team.id,
      );
      const teamPayments = payments.filter((payment) => payment.equipe_id === team.id);
      const teamGoals = goals.filter((goal) => goal.equipe_id === team.id);
      const teamRanking = ranking.filter((row) => row.team === team.nome);
      const previousMonthFilters: DashboardFilters = {
        ...filters,
        month: subMonths(new Date(filters.year, filters.month - 1, 1), 1).getMonth() + 1,
        year: subMonths(new Date(filters.year, filters.month - 1, 1), 1).getFullYear(),
      };

      const previousPayments = filterPayments(dataset, previousMonthFilters).filter(
        (payment) => payment.equipe_id === team.id,
      );

      const currentCollected = sumPayments(teamPayments);
      const previousCollected = sumPayments(previousPayments);

      return {
        teamId: team.id,
        team: team.nome,
        supervisor: team.supervisor_id
          ? supervisors.get(team.supervisor_id)?.nome ?? "-"
          : "-",
        operators: teamOperators.length,
        collected: currentCollected,
        goal: sumGoals(teamGoals),
        goalCompletion: safeDivide(currentCollected, sumGoals(teamGoals)) * 100,
        bestOperator: teamRanking[0]?.operator ?? "Sem destaque",
        evolution: safeDivide(currentCollected - previousCollected, previousCollected) * 100,
      } satisfies TeamPerformanceRow;
    })
    .sort((left, right) => right.collected - left.collected)
    .filter((row) => row.collected > 0 || row.goal > 0);
}

export function buildWalletPerformance(
  dataset: PortalDataset,
  filters: DashboardFilters,
) {
  const ranking = buildOperatorRanking(dataset, filters);
  const payments = filterPayments(dataset, filters);
  const agreements = filterAgreements(dataset, filters);

  return dataset.wallets
    .filter((wallet) => !filters.walletId || wallet.id === filters.walletId)
    .filter((wallet) => !filters.creditor || wallet.credor === filters.creditor)
    .map((wallet) => {
      const walletPayments = payments.filter(
        (payment) => payment.carteira_id === wallet.id,
      );
      const walletAgreements = agreements.filter(
        (agreement) => agreement.carteira_id === wallet.id,
      );
      const walletRanking = ranking.filter((row) => row.wallet === wallet.nome);
      const agreementValue = walletAgreements.reduce(
        (total, agreement) => total + agreement.valor_acordo,
        0,
      );
      const collected = sumPayments(walletPayments);
      const agreementCount = walletAgreements.length;

      return {
        walletId: wallet.id,
        wallet: wallet.nome,
        creditor: wallet.credor,
        collected,
        agreements: agreementCount,
        averageTicket: safeDivide(collected, agreementCount),
        recoveryRate: safeDivide(collected, agreementValue) * 100,
        topOperator: walletRanking[0]?.operator ?? "Sem destaque",
        operatorRanking: walletRanking.slice(0, 5),
      } satisfies WalletPerformanceRow;
    })
    .sort((left, right) => right.collected - left.collected)
    .filter((row) => row.collected > 0 || row.agreements > 0);
}

export function buildDailyEvolution(
  dataset: PortalDataset,
  filters: DashboardFilters,
) {
  const payments = filterPayments(dataset, filters);
  const agreements = filterAgreements(dataset, filters);
  const byDay = new Map<string, RevenuePoint & { sortKey: string }>();

  payments.forEach((payment) => {
    const sortKey = payment.data_pagamento;
    const label = format(parseISO(sortKey), "dd/MM", { locale: ptBR });
    const current = byDay.get(sortKey) ?? {
      label,
      sortKey,
      arrecadacao: 0,
      acordos: 0,
    };
    current.arrecadacao += payment.valor_pago;
    byDay.set(sortKey, current);
  });

  agreements.forEach((agreement) => {
    const sortKey = agreement.data_acordo;
    const label = format(parseISO(sortKey), "dd/MM", { locale: ptBR });
    const current = byDay.get(sortKey) ?? {
      label,
      sortKey,
      arrecadacao: 0,
      acordos: 0,
    };
    current.acordos += 1;
    byDay.set(sortKey, current);
  });

  return Array.from(byDay.values())
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .map((point) => ({
      label: point.label,
      arrecadacao: point.arrecadacao,
      acordos: point.acordos,
    }));
}

export function buildMonthlyEvolution(
  dataset: PortalDataset,
  filters: DashboardFilters,
) {
  const baseDate = new Date(filters.year, filters.month - 1, 1);
  const start = subMonths(baseDate, 5);
  const months = eachMonthOfInterval({ start, end: baseDate });
  const walletMap = buildWalletMap(dataset.wallets);

  return months.map((monthDate) => {
    const monthFilters: DashboardFilters = {
      ...filters,
      month: monthDate.getMonth() + 1,
      year: monthDate.getFullYear(),
      startDate: undefined,
      endDate: undefined,
    };

    const monthPayments = dataset.payments.filter(
      (payment) =>
        recordMatchesEntityFilter(
          payment.equipe_id,
          payment.operador_id,
          payment.carteira_id,
          monthFilters,
          walletMap,
        ) &&
        inDateRange(payment.data_pagamento, monthFilters),
    );

    const monthAgreements = dataset.agreements.filter(
      (agreement) =>
        recordMatchesEntityFilter(
          agreement.equipe_id,
          agreement.operador_id,
          agreement.carteira_id,
          monthFilters,
          walletMap,
        ) &&
        inDateRange(agreement.data_acordo, monthFilters),
    );

    const monthGoals = filterGoals(dataset, monthFilters);

    return {
      label: format(monthDate, "MMM/yy", { locale: ptBR }),
      arrecadacao: sumPayments(monthPayments),
      acordos: monthAgreements.length,
      meta: sumGoals(monthGoals),
    } satisfies RevenuePoint;
  });
}

export function buildDashboardSummary(
  dataset: PortalDataset,
  filters: DashboardFilters,
) {
  const payments = filterPayments(dataset, filters);
  const agreements = filterAgreements(dataset, filters);
  const goals = filterGoals(dataset, filters);
  const operatorRanking = buildOperatorRanking(dataset, filters);
  const teamPerformance = buildTeamPerformance(dataset, filters);
  const walletPerformance = buildWalletPerformance(dataset, filters);

  const previousDate = subMonths(new Date(filters.year, filters.month - 1, 1), 1);
  const previousFilters: DashboardFilters = {
    ...filters,
    month: previousDate.getMonth() + 1,
    year: previousDate.getFullYear(),
    startDate: undefined,
    endDate: undefined,
  };

  const previousCollected = sumPayments(filterPayments(dataset, previousFilters));
  const currentCollected = sumPayments(payments);
  const totalGoal = sumGoals(goals);
  const remainingGoal = Math.max(totalGoal - currentCollected, 0);
  const receivableTotal = agreements.reduce(
    (total, agreement) =>
      total + Math.max(agreement.valor_acordo - agreement.valor_pago, 0),
    0,
  );
  const { elapsedDays, remainingDays, totalDays } = buildCurrentPeriodProgress(filters);
  const activeOperators = countActiveOperators(dataset, filters, payments, agreements);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCollected = payments
    .filter((payment) => payment.data_pagamento === todayKey)
    .reduce((total, payment) => total + payment.valor_pago, 0);

  return {
    totalCollected: currentCollected,
    totalGoal,
    goalCompletion: safeDivide(currentCollected, totalGoal) * 100,
    agreementCount: agreements.length,
    averageTicket: safeDivide(currentCollected, agreements.length),
    monthlyDelta: safeDivide(currentCollected - previousCollected, previousCollected) * 100,
    receivableTotal,
    remainingGoal,
    lastMonthCollected: previousCollected,
    collectedToday: todayCollected,
    projectedMonthEnd:
      elapsedDays > 0 ? safeDivide(currentCollected, elapsedDays) * totalDays : 0,
    requiredDailyPace:
      remainingGoal > 0 && remainingDays > 0
        ? safeDivide(remainingGoal, remainingDays)
        : 0,
    averagePerOperatorDay:
      elapsedDays > 0 && activeOperators > 0
        ? safeDivide(currentCollected, activeOperators * elapsedDays)
        : 0,
    officeFeesCollected: payments.reduce(
      (total, payment) => total + (payment.valor_escritorio ?? 0),
      0,
    ),
    paymentCount: payments.length,
    activeOperators,
    bestOperator: operatorRanking[0]
      ? {
          label: operatorRanking[0].operator,
          value: operatorRanking[0].collected,
          subtitle: operatorRanking[0].team,
        }
      : undefined,
    bestTeam: teamPerformance[0]
      ? {
          label: teamPerformance[0].team,
          value: teamPerformance[0].collected,
          subtitle: `${teamPerformance[0].operators} operadores`,
        }
      : undefined,
    bestWallet: walletPerformance[0]
      ? {
          label: walletPerformance[0].wallet,
          value: walletPerformance[0].collected,
          subtitle: walletPerformance[0].creditor,
        }
      : undefined,
  } satisfies DashboardSummary;
}

export function buildOperatorOverview(
  dataset: PortalDataset,
  filters: DashboardFilters,
  operatorId: string,
) {
  const operator = dataset.operators.find((item) => item.id === operatorId);
  const ranking = buildOperatorRanking(dataset, filters);
  const overallEntry = ranking.find((entry) => entry.operatorId === operatorId);
  const teamEntries = operator?.equipe_id
    ? ranking.filter((entry) => entry.team === dataset.teams.find((team) => team.id === operator.equipe_id)?.nome)
    : [];
  const operatorFilters: DashboardFilters = {
    ...filters,
    operatorId,
  };
  const payments = filterPayments(dataset, operatorFilters);
  const agreements = filterAgreements(dataset, operatorFilters);
  const goals = filterGoals(dataset, operatorFilters);
  const teamAverage = teamEntries.length
    ? teamEntries.reduce((total, entry) => total + entry.collected, 0) /
      teamEntries.length
    : 0;

  return {
    collected: sumPayments(payments),
    goal: sumGoals(goals),
    goalCompletion: safeDivide(sumPayments(payments), sumGoals(goals)) * 100,
    rankingOverall: overallEntry?.position ?? 0,
    rankingTeam: teamEntries.find((entry) => entry.operatorId === operatorId)?.position ?? 0,
    agreements: agreements.length,
    averageTicket: safeDivide(sumPayments(payments), agreements.length),
    dailyEvolution: buildDailyEvolution(dataset, operatorFilters),
    teamAverage,
    teamAverageGap: sumPayments(payments) - teamAverage,
  } satisfies OperatorOverview;
}
