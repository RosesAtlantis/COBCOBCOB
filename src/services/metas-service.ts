import "server-only";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { canManageGoals } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registrarAuditoriaSegura } from "@/services/auditoria-service";
import {
  filterByQuery,
  formatMutationError,
} from "@/services/cadastros-utils";
import { getClientsContext, uniqueOptions } from "@/services/clientes-service";
import type {
  FilterOption,
  GoalRegistryPageData,
  GoalRegistryRow,
} from "@/types/portal";

const goalSchema = z
  .object({
    mes: z.coerce.number().int().min(1, "Mes invalido.").max(12, "Mes invalido."),
    ano: z.coerce.number().int().min(2020, "Ano invalido.").max(2100, "Ano invalido."),
    valorMeta: z.coerce.number().positive("Informe o valor da meta."),
    operadorId: z.string().uuid().nullable().optional(),
    equipeId: z.string().uuid().nullable().optional(),
    carteiraId: z.string().uuid().nullable().optional(),
    credorId: z.string().uuid().nullable().optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (input) =>
      Boolean(input.operadorId || input.equipeId || input.carteiraId || input.credorId),
    {
      message: "Informe ao menos um vinculo: operador, equipe, carteira ou credor.",
      path: ["operadorId"],
    },
  );

const updateGoalSchema = goalSchema.extend({
  id: z.string().uuid("Meta invalida."),
});

const goalStatusSchema = z.object({
  id: z.string().uuid("Meta invalida."),
  ativo: z.boolean(),
});

function buildGoalRows(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): GoalRegistryRow[] {
  const operatorById = new Map(
    context.operators.map((operator) => [operator.id, operator.nome]),
  );
  const teamById = new Map(context.teams.map((team) => [team.id, team.nome]));
  const walletById = new Map(context.wallets.map((wallet) => [wallet.id, wallet]));
  const creditorById = new Map(
    context.creditors.map((creditor) => [creditor.id, creditor.nome]),
  );

  return context.goals
    .map((goal) => ({
      ...goal,
      operatorName: goal.operador_id ? operatorById.get(goal.operador_id) ?? null : null,
      teamName: goal.equipe_id ? teamById.get(goal.equipe_id) ?? null : null,
      walletName: goal.carteira_id ? walletById.get(goal.carteira_id)?.nome ?? null : null,
      creditorName:
        (goal.credor_id ? creditorById.get(goal.credor_id) ?? null : null) ??
        (goal.carteira_id ? walletById.get(goal.carteira_id)?.credor ?? null : null),
    }))
    .sort((left, right) => {
      if (left.ano !== right.ano) {
        return right.ano - left.ano;
      }

      if (left.mes !== right.mes) {
        return right.mes - left.mes;
      }

      return (left.operatorName ?? left.teamName ?? left.walletName ?? "")
        .localeCompare(right.operatorName ?? right.teamName ?? right.walletName ?? "");
    });
}

function filterGoalRows(rows: GoalRegistryRow[], query?: string) {
  return filterByQuery(rows, query, (row) =>
    [
      row.operatorName,
      row.teamName,
      row.walletName,
      row.creditorName,
      row.mes,
      row.ano,
      row.valor_meta,
      row.ativo ? "ativo" : "inativo",
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildGoalOptions(
  context: Awaited<ReturnType<typeof getClientsContext>>,
) {
  return {
    operators: uniqueOptions(
      context.operators.map((operator) => ({
        value: operator.id,
        label: operator.nome,
      })),
    ),
    teams: uniqueOptions(
      context.teams.map((team) => ({
        value: team.id,
        label: team.nome,
      })),
    ),
    wallets: uniqueOptions(
      context.wallets.map((wallet) => ({
        value: wallet.id,
        label: wallet.nome,
        description: wallet.credor || undefined,
      })),
    ),
    creditors: uniqueOptions(
      context.creditors.map((creditor) => ({
        value: creditor.id,
        label: creditor.nome,
        description: creditor.codigo ?? undefined,
      })),
    ),
  } satisfies {
    operators: FilterOption[];
    teams: FilterOption[];
    wallets: FilterOption[];
    creditors: FilterOption[];
  };
}

function resolveGoalLinks(
  context: Awaited<ReturnType<typeof getClientsContext>>,
  input: {
    operadorId?: string | null;
    equipeId?: string | null;
    carteiraId?: string | null;
    credorId?: string | null;
  },
) {
  const operator = input.operadorId
    ? context.operators.find((item) => item.id === input.operadorId)
    : null;
  const team = input.equipeId
    ? context.teams.find((item) => item.id === input.equipeId)
    : null;
  const wallet = input.carteiraId
    ? context.wallets.find((item) => item.id === input.carteiraId)
    : null;
  const creditor = input.credorId
    ? context.creditors.find((item) => item.id === input.credorId)
    : null;

  if (input.operadorId && !operator) {
    throw new Error("Operador fora do escopo permitido.");
  }

  if (input.equipeId && !team) {
    throw new Error("Equipe fora do escopo permitido.");
  }

  if (input.carteiraId && !wallet) {
    throw new Error("Carteira fora do escopo permitido.");
  }

  if (input.credorId && !creditor) {
    throw new Error("Credor fora do escopo permitido.");
  }

  return {
    operadorId: operator?.id ?? null,
    equipeId: team?.id ?? operator?.equipe_id ?? null,
    carteiraId: wallet?.id ?? null,
    credorId: creditor?.id ?? wallet?.credor_id ?? null,
  };
}

function isDuplicateGoal(
  rows: GoalRegistryRow[],
  input: {
    mes: number;
    ano: number;
    operadorId: string | null;
    equipeId: string | null;
    carteiraId: string | null;
    credorId: string | null;
  },
  excludedId?: string,
) {
  return rows.some((row) => {
    if (row.id === excludedId) {
      return false;
    }

    return (
      row.mes === input.mes &&
      row.ano === input.ano &&
      row.operador_id === input.operadorId &&
      row.equipe_id === input.equipeId &&
      row.carteira_id === input.carteiraId &&
      (row.credor_id ?? null) === input.credorId
    );
  });
}

export async function listarMetas(query?: string) {
  const context = await getClientsContext();
  return filterGoalRows(buildGoalRows(context), query);
}

export async function getMetasPageData(
  query?: string,
): Promise<GoalRegistryPageData> {
  const context = await getClientsContext();
  const rows = filterGoalRows(buildGoalRows(context), query);
  const now = new Date();
  const options = buildGoalOptions(context);

  return {
    profile: context.profile,
    goals: rows,
    operators: options.operators,
    teams: options.teams,
    wallets: options.wallets,
    creditors: options.creditors,
    canManage: canManageGoals(context.profile.perfil),
    demoMode: context.demoMode,
    summary: {
      total: rows.length,
      active: rows.filter((row) => row.ativo).length,
      inactive: rows.filter((row) => !row.ativo).length,
      currentMonth: rows.filter(
        (row) => row.ativo && row.mes === now.getMonth() + 1 && row.ano === now.getFullYear(),
      ).length,
    },
  };
}

export async function criarMeta(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = goalSchema.parse(rawInput);
  const context = await getClientsContext();

  if (!canManageGoals(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar metas.");
  }

  const resolvedLinks = resolveGoalLinks(context, input);
  const rows = buildGoalRows(context);

  if (
    isDuplicateGoal(rows, {
      mes: input.mes,
      ano: input.ano,
      operadorId: resolvedLinks.operadorId,
      equipeId: resolvedLinks.equipeId,
      carteiraId: resolvedLinks.carteiraId,
      credorId: resolvedLinks.credorId,
    })
  ) {
    throw new Error("Ja existe uma meta para esta combinacao de competencia e vinculos.");
  }

  if (!isSupabaseConfigured()) {
    return {
      goalId: `demo-goal-${Date.now()}`,
      message: "Modo demonstracao: meta validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      goalId: `demo-goal-${Date.now()}`,
      message: "Modo demonstracao: meta validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("metas")
    .insert({
      mes: input.mes,
      ano: input.ano,
      operador_id: resolvedLinks.operadorId,
      equipe_id: resolvedLinks.equipeId,
      carteira_id: resolvedLinks.carteiraId,
      credor_id: resolvedLinks.credorId,
      valor_meta: input.valorMeta,
      ativo: input.ativo ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel cadastrar a meta."),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "meta",
    entidadeId: data.id,
    acao: "meta_criada",
    descricao: "Meta cadastrada manualmente.",
    operadorId: data.operador_id,
    equipeId: data.equipe_id,
    carteiraId: data.carteira_id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosNovos: {
      mes: data.mes,
      ano: data.ano,
      valorMeta: data.valor_meta,
      credorId: data.credor_id,
      ativo: data.ativo,
    },
  });

  return {
    goalId: data.id,
    message: "Meta cadastrada com sucesso.",
    demoMode: false,
  };
}

export async function atualizarMeta(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = updateGoalSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.goals.find((goal) => goal.id === input.id);

  if (!canManageGoals(profile.perfil)) {
    throw new Error("Seu perfil nao pode editar metas.");
  }

  if (!existing) {
    throw new Error("Meta nao encontrada.");
  }

  const resolvedLinks = resolveGoalLinks(context, input);
  const rows = buildGoalRows(context);

  if (
    isDuplicateGoal(
      rows,
      {
        mes: input.mes,
        ano: input.ano,
        operadorId: resolvedLinks.operadorId,
        equipeId: resolvedLinks.equipeId,
        carteiraId: resolvedLinks.carteiraId,
        credorId: resolvedLinks.credorId,
      },
      existing.id,
    )
  ) {
    throw new Error("Ja existe outra meta para esta combinacao de competencia e vinculos.");
  }

  if (!isSupabaseConfigured()) {
    return {
      goalId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      goalId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("metas")
    .update({
      mes: input.mes,
      ano: input.ano,
      operador_id: resolvedLinks.operadorId,
      equipe_id: resolvedLinks.equipeId,
      carteira_id: resolvedLinks.carteiraId,
      credor_id: resolvedLinks.credorId,
      valor_meta: input.valorMeta,
      ativo: input.ativo ?? existing.ativo,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar a meta."),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "meta",
    entidadeId: data.id,
    acao: "meta_atualizada",
    descricao: "Meta atualizada manualmente.",
    operadorId: data.operador_id,
    equipeId: data.equipe_id,
    carteiraId: data.carteira_id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      mes: existing.mes,
      ano: existing.ano,
      valorMeta: existing.valor_meta,
      credorId: existing.credor_id ?? null,
      ativo: existing.ativo,
    },
    dadosNovos: {
      mes: data.mes,
      ano: data.ano,
      valorMeta: data.valor_meta,
      credorId: data.credor_id,
      ativo: data.ativo,
    },
  });

  return {
    goalId: data.id,
    message: "Meta atualizada com sucesso.",
    demoMode: false,
  };
}

export async function inativarMeta(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = goalStatusSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.goals.find((goal) => goal.id === input.id);

  if (!canManageGoals(profile.perfil)) {
    throw new Error("Seu perfil nao pode alterar o status de metas.");
  }

  if (!existing) {
    throw new Error("Meta nao encontrada.");
  }

  if (!isSupabaseConfigured()) {
    return {
      goalId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      goalId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("metas")
    .update({ ativo: input.ativo })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar o status da meta."),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "meta",
    entidadeId: existing.id,
    acao: data.ativo ? "meta_ativada" : "meta_inativada",
    descricao: data.ativo
      ? "Meta reativada manualmente."
      : "Meta inativada manualmente.",
    operadorId: data.operador_id,
    equipeId: data.equipe_id,
    carteiraId: data.carteira_id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      ativo: existing.ativo,
    },
    dadosNovos: {
      ativo: data.ativo,
    },
  });

  return {
    goalId: existing.id,
    message: data.ativo
      ? "Meta ativada com sucesso."
      : "Meta inativada com sucesso.",
    demoMode: false,
  };
}

export function parseCreateGoalInput(payload: unknown) {
  return goalSchema.parse(payload);
}

export function parseUpdateGoalInput(payload: unknown) {
  return updateGoalSchema.parse(payload);
}

export function parseGoalStatusInput(payload: unknown) {
  return goalStatusSchema.parse(payload);
}
