import "server-only";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { normalizeText } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { canManageOperators } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { registrarAuditoriaSegura } from "@/services/auditoria-service";
import {
  entityIdSchema,
  filterByQuery,
  formatMutationError,
  resolveNullableString,
} from "@/services/cadastros-utils";
import { getClientsContext, uniqueOptions } from "@/services/clientes-service";
import type {
  FilterOption,
  OperatorRegistryPageData,
  OperatorRegistryRow,
} from "@/types/portal";

const operatorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do operador."),
  email: z
    .string()
    .trim()
    .email("E-mail invalido.")
    .nullable()
    .optional()
    .or(z.literal("")),
  equipeId: entityIdSchema("Equipe invalida.").nullable().optional(),
  profileId: entityIdSchema("Perfil invalido.").nullable().optional(),
  ativo: z.boolean().optional(),
});

const updateOperatorSchema = operatorSchema.extend({
  id: entityIdSchema("Operador invalido."),
});

const operatorStatusSchema = z.object({
  id: entityIdSchema("Operador invalido."),
  ativo: z.boolean(),
});

function buildOperatorRows(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): OperatorRegistryRow[] {
  const teamById = new Map(context.teams.map((team) => [team.id, team.nome]));
  const profileByOperatorId = new Map(
    context.profiles
      .filter((profile) => profile.operador_id)
      .map((profile) => [profile.operador_id ?? "", profile]),
  );

  return context.operators
    .map((operator) => {
      const linkedProfile = profileByOperatorId.get(operator.id) ?? null;

      return {
        ...operator,
        teamName: operator.equipe_id ? teamById.get(operator.equipe_id) ?? "-" : "-",
        profileId: linkedProfile?.id ?? null,
        userName: linkedProfile?.nome ?? null,
        userRole: linkedProfile?.perfil ?? null,
      };
    })
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

function filterOperatorRows(rows: OperatorRegistryRow[], query?: string) {
  return filterByQuery(rows, query, (row) =>
    [
      row.nome,
      row.email,
      row.teamName,
      row.userName,
      row.userRole,
      row.ativo ? "ativo" : "inativo",
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildTeamOptions(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): FilterOption[] {
  return uniqueOptions(
    context.teams.map((team) => ({
      value: team.id,
      label: team.nome,
    })),
  );
}

function buildProfileOptions(
  context: Awaited<ReturnType<typeof getClientsContext>>,
  operatorId?: string,
): FilterOption[] {
  return uniqueOptions(
    context.profiles
      .filter(
        (profile) =>
          !profile.operador_id || profile.operador_id === operatorId,
      )
      .map((profile) => ({
        value: profile.id,
        label: profile.nome,
        description: profile.perfil,
      })),
  );
}

function resolveScopedTeamId(
  context: Awaited<ReturnType<typeof getClientsContext>>,
  requestedTeamId: string | null | undefined,
  fallbackTeamId: string | null = null,
) {
  const requestedTeam = requestedTeamId
    ? context.teams.find((team) => team.id === requestedTeamId)
    : null;

  if (requestedTeamId && !requestedTeam) {
    throw new Error("Equipe fora do escopo permitido para este perfil.");
  }

  if (requestedTeam) {
    return requestedTeam.id;
  }

  if (fallbackTeamId) {
    return fallbackTeamId;
  }

  if (context.profile.perfil === "supervisor") {
    return context.profile.equipe_id ?? context.teams[0]?.id ?? null;
  }

  return null;
}

async function syncOperatorProfileLink(params: {
  context: Awaited<ReturnType<typeof getClientsContext>>;
  operatorId: string;
  teamId: string | null;
  selectedProfileId: string | null;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
}) {
  const adminClient = getSupabaseAdminClient();
  const client = adminClient ?? params.supabase;
  const targetProfile = params.selectedProfileId
    ? params.context.profiles.find((profile) => profile.id === params.selectedProfileId)
    : null;

  if (params.selectedProfileId && !targetProfile) {
    throw new Error("Usuario/perfil fora do escopo permitido.");
  }

  if (
    targetProfile?.operador_id &&
    targetProfile.operador_id !== params.operatorId
  ) {
    throw new Error("Este usuario ja esta vinculado a outro operador.");
  }

  const linkedProfiles = params.context.profiles.filter(
    (profile) => profile.operador_id === params.operatorId,
  );

  for (const linkedProfile of linkedProfiles) {
    if (linkedProfile.id === params.selectedProfileId) {
      continue;
    }

    const { error } = await client
      .from("profiles")
      .update({ operador_id: null })
      .eq("id", linkedProfile.id);

    if (error) {
      throw new Error(
        formatMutationError(
          error.message,
          "Nao foi possivel atualizar o usuario vinculado ao operador.",
        ),
      );
    }
  }

  if (!targetProfile) {
    return;
  }

  const { error } = await client
    .from("profiles")
    .update({
      operador_id: params.operatorId,
      equipe_id: params.teamId ?? targetProfile.equipe_id ?? null,
    })
    .eq("id", targetProfile.id);

  if (error) {
    throw new Error(
      formatMutationError(
        error.message,
        "Nao foi possivel vincular o usuario ao operador.",
      ),
    );
  }
}

export async function listarOperadores(query?: string) {
  const context = await getClientsContext();
  return filterOperatorRows(buildOperatorRows(context), query);
}

export async function getOperadoresPageData(
  query?: string,
): Promise<OperatorRegistryPageData> {
  const context = await getClientsContext();
  const rows = filterOperatorRows(buildOperatorRows(context), query);

  return {
    profile: context.profile,
    operators: rows,
    teams: buildTeamOptions(context),
    profiles: buildProfileOptions(context),
    canManage: canManageOperators(context.profile.perfil),
    demoMode: context.demoMode,
    summary: {
      total: rows.length,
      active: rows.filter((row) => row.ativo).length,
      inactive: rows.filter((row) => !row.ativo).length,
      linkedTeams: new Set(rows.map((row) => row.equipe_id).filter(Boolean)).size,
    },
  };
}

export async function criarOperador(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "supervisor"]);
  const input = operatorSchema.parse(rawInput);
  const context = await getClientsContext();

  if (!canManageOperators(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar operadores.");
  }

  const resolvedTeamId = resolveScopedTeamId(context, input.equipeId ?? null);
  const duplicated = context.operators.find(
    (operator) =>
      normalizeText(operator.nome) === normalizeText(input.nome) &&
      operator.equipe_id === resolvedTeamId,
  );

  if (duplicated) {
    throw new Error("Ja existe um operador com este nome na equipe informada.");
  }

  if (!isSupabaseConfigured()) {
    return {
      operatorId: `demo-operator-${Date.now()}`,
      message: "Modo demonstracao: operador validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      operatorId: `demo-operator-${Date.now()}`,
      message: "Modo demonstracao: operador validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("operadores")
    .insert({
      nome: input.nome,
      email: resolveNullableString(input.email),
      equipe_id: resolvedTeamId,
      ativo: input.ativo ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel cadastrar o operador."),
    );
  }

  await syncOperatorProfileLink({
    context,
    operatorId: data.id,
    teamId: data.equipe_id,
    selectedProfileId: input.profileId ?? null,
    supabase,
  });

  await registrarAuditoriaSegura({
    entidade: "operador",
    entidadeId: data.id,
    acao: "operador_criado",
    descricao: "Operador cadastrado manualmente.",
    operadorId: data.id,
    equipeId: data.equipe_id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosNovos: {
      nome: data.nome,
      email: data.email,
      equipeId: data.equipe_id,
      ativo: data.ativo,
    },
  });

  return {
    operatorId: data.id,
    message: "Operador cadastrado com sucesso.",
    demoMode: false,
  };
}

export async function atualizarOperador(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "supervisor"]);
  const input = updateOperatorSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.operators.find((operator) => operator.id === input.id);

  if (!canManageOperators(profile.perfil)) {
    throw new Error("Seu perfil nao pode editar operadores.");
  }

  if (!existing) {
    throw new Error("Operador nao encontrado.");
  }

  const resolvedTeamId = resolveScopedTeamId(
    context,
    input.equipeId ?? null,
    existing.equipe_id,
  );
  const duplicated = context.operators.find(
    (operator) =>
      operator.id !== input.id &&
      normalizeText(operator.nome) === normalizeText(input.nome) &&
      operator.equipe_id === resolvedTeamId,
  );

  if (duplicated) {
    throw new Error("Ja existe outro operador com este nome na equipe informada.");
  }

  if (!isSupabaseConfigured()) {
    return {
      operatorId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      operatorId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("operadores")
    .update({
      nome: input.nome,
      email: resolveNullableString(input.email),
      equipe_id: resolvedTeamId,
      ativo: input.ativo ?? existing.ativo,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar o operador."),
    );
  }

  await syncOperatorProfileLink({
    context,
    operatorId: data.id,
    teamId: data.equipe_id,
    selectedProfileId: input.profileId ?? null,
    supabase,
  });

  await registrarAuditoriaSegura({
    entidade: "operador",
    entidadeId: data.id,
    acao: "operador_atualizado",
    descricao: "Operador atualizado manualmente.",
    operadorId: data.id,
    equipeId: data.equipe_id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      nome: existing.nome,
      email: existing.email,
      equipeId: existing.equipe_id,
      ativo: existing.ativo,
    },
    dadosNovos: {
      nome: data.nome,
      email: data.email,
      equipeId: data.equipe_id,
      ativo: data.ativo,
    },
  });

  return {
    operatorId: data.id,
    message: "Operador atualizado com sucesso.",
    demoMode: false,
  };
}

export async function inativarOperador(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "supervisor"]);
  const input = operatorStatusSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.operators.find((operator) => operator.id === input.id);

  if (!canManageOperators(profile.perfil)) {
    throw new Error("Seu perfil nao pode alterar o status de operadores.");
  }

  if (!existing) {
    throw new Error("Operador nao encontrado.");
  }

  if (!isSupabaseConfigured()) {
    return {
      operatorId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      operatorId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("operadores")
    .update({ ativo: input.ativo })
    .eq("id", existing.id)
    .select("id,nome,ativo,equipe_id")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(
        error?.message,
        "Nao foi possivel atualizar o status do operador.",
      ),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "operador",
    entidadeId: existing.id,
    acao: data.ativo ? "operador_ativado" : "operador_inativado",
    descricao: data.ativo
      ? "Operador reativado manualmente."
      : "Operador inativado manualmente.",
    operadorId: existing.id,
    equipeId: data.equipe_id,
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
    operatorId: existing.id,
    message: data.ativo
      ? "Operador ativado com sucesso."
      : "Operador inativado com sucesso.",
    demoMode: false,
  };
}

export function parseCreateOperatorInput(payload: unknown) {
  return operatorSchema.parse(payload);
}

export function parseUpdateOperatorInput(payload: unknown) {
  return updateOperatorSchema.parse(payload);
}

export function parseOperatorStatusInput(payload: unknown) {
  return operatorStatusSchema.parse(payload);
}
