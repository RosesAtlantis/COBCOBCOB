import type {
  FilterOption,
  FilterOptions,
  PortalDataset,
  PortalProfile,
} from "@/types/portal";

function uniqueOptions(options: FilterOption[]) {
  return Array.from(
    new Map(options.map((option) => [option.value, option])).values(),
  );
}

export function scopeDatasetToProfile(
  dataset: PortalDataset,
  profile: PortalProfile,
) {
  if (["admin", "gerente", "financeiro"].includes(profile.perfil)) {
    return dataset;
  }

  const supervisorTeamIds = dataset.teams
    .filter(
      (team) => team.supervisor_id === profile.id || team.id === profile.equipe_id,
    )
    .map((team) => team.id);

  const scopedTeamIds =
    profile.perfil === "supervisor"
      ? new Set(supervisorTeamIds)
      : new Set(profile.equipe_id ? [profile.equipe_id] : []);

  const scopedOperatorIds =
    profile.perfil === "operador"
      ? new Set(profile.operador_id ? [profile.operador_id] : [])
      : new Set(
          dataset.operators
            .filter((operator) => operator.equipe_id && scopedTeamIds.has(operator.equipe_id))
            .map((operator) => operator.id),
        );

  const payments = dataset.payments.filter((payment) =>
    payment.operador_id
      ? scopedOperatorIds.has(payment.operador_id)
      : payment.equipe_id
        ? scopedTeamIds.has(payment.equipe_id)
        : false,
  );

  const agreements = dataset.agreements.filter((agreement) =>
    agreement.operador_id
      ? scopedOperatorIds.has(agreement.operador_id)
      : agreement.equipe_id
        ? scopedTeamIds.has(agreement.equipe_id)
        : false,
  );

  const actions = dataset.actions.filter((action) =>
    action.operador_id
      ? scopedOperatorIds.has(action.operador_id)
      : action.equipe_id
        ? scopedTeamIds.has(action.equipe_id)
        : false,
  );

  const goals = dataset.goals.filter((goal) => {
    if (profile.perfil === "operador") {
      return goal.operador_id === profile.operador_id;
    }

    if (profile.perfil === "supervisor") {
      return goal.equipe_id ? scopedTeamIds.has(goal.equipe_id) : false;
    }

    return false;
  });

  const operatorIds = new Set(
    [...payments, ...agreements]
      .map((entry) => entry.operador_id)
      .filter((value): value is string => Boolean(value)),
  );

  const teamIds = new Set(
    [...payments, ...agreements]
      .map((entry) => entry.equipe_id)
      .filter((value): value is string => Boolean(value)),
  );

  const walletIds = new Set(
    [...payments, ...agreements]
      .map((entry) => entry.carteira_id)
      .filter((value): value is string => Boolean(value)),
  );

  const wallets = dataset.wallets.filter((wallet) => walletIds.has(wallet.id));
  const creditorNames = new Set(wallets.map((wallet) => wallet.credor));

  return {
    profiles: dataset.profiles.filter((item) => {
      if (item.id === profile.id) {
        return true;
      }

      if (profile.perfil === "supervisor") {
        return item.equipe_id ? teamIds.has(item.equipe_id) : false;
      }

      return item.operador_id ? operatorIds.has(item.operador_id) : false;
    }),
    operators: dataset.operators.filter((operator) => operatorIds.has(operator.id)),
    teams: dataset.teams.filter((team) => teamIds.has(team.id)),
    creditors: dataset.creditors.filter((creditor) => creditorNames.has(creditor.nome)),
    wallets,
    goals,
    payments,
    agreements,
    actions,
    imports: dataset.imports.filter((item) => item.usuario_id === profile.user_id),
  };
}

export function buildFilterOptions(dataset: PortalDataset): FilterOptions {
  const years = Array.from(
    new Set(
      [
        ...dataset.payments.map((payment) =>
          new Date(payment.data_pagamento).getFullYear(),
        ),
        ...dataset.goals.map((goal) => goal.ano),
      ].filter(Number.isFinite),
    ),
  ).sort((left, right) => right - left);

  return {
    teams: uniqueOptions(
      dataset.teams.map((team) => ({
        value: team.id,
        label: team.nome,
      })),
    ),
    operators: uniqueOptions(
      dataset.operators.map((operator) => ({
        value: operator.id,
        label: operator.nome,
      })),
    ),
    wallets: uniqueOptions(
      dataset.wallets.map((wallet) => ({
        value: wallet.id,
        label: wallet.nome,
      })),
    ),
    creditors: uniqueOptions(
      dataset.creditors.map((creditor) => ({
        value: creditor.nome,
        label: creditor.nome,
      })),
    ),
    years: years.length ? years : [new Date().getFullYear()],
  };
}
