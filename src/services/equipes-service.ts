import "server-only";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { normalizeText } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { canManageTeams } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registrarAuditoriaSegura } from "@/services/auditoria-service";
import {
  filterByQuery,
  formatMutationError,
} from "@/services/cadastros-utils";
import { getClientsContext, uniqueOptions } from "@/services/clientes-service";
import type {
  FilterOption,
  TeamRegistryPageData,
  TeamRegistryRow,
} from "@/types/portal";

const teamSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da equipe."),
  supervisorId: z.string().uuid().nullable().optional(),
  ativo: z.boolean().optional(),
});

const updateTeamSchema = teamSchema.extend({
  id: z.string().uuid("Equipe invalida."),
});

const teamStatusSchema = z.object({
  id: z.string().uuid("Equipe invalida."),
  ativo: z.boolean(),
});

function buildTeamRows(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): TeamRegistryRow[] {
  const supervisorById = new Map(context.profiles.map((profile) => [profile.id, profile.nome]));

  return context.teams
    .map((team) => ({
      ...team,
      supervisorName: team.supervisor_id
        ? supervisorById.get(team.supervisor_id) ?? null
        : null,
      operatorsCount: context.operators.filter((operator) => operator.equipe_id === team.id)
        .length,
    }))
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

function filterTeamRows(rows: TeamRegistryRow[], query?: string) {
  return filterByQuery(rows, query, (row) =>
    [
      row.nome,
      row.supervisorName,
      row.ativo ? "ativo" : "inativo",
      row.operatorsCount,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildSupervisorOptions(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): FilterOption[] {
  return uniqueOptions(
    context.profiles
      .filter((profile) => ["admin", "gerente", "supervisor"].includes(profile.perfil))
      .map((profile) => ({
        value: profile.id,
        label: profile.nome,
        description: profile.perfil,
      })),
  );
}

export async function listarEquipes(query?: string) {
  const context = await getClientsContext();
  return filterTeamRows(buildTeamRows(context), query);
}

export async function getEquipesPageData(
  query?: string,
): Promise<TeamRegistryPageData> {
  const context = await getClientsContext();
  const rows = filterTeamRows(buildTeamRows(context), query);

  return {
    profile: context.profile,
    teams: rows,
    supervisors: buildSupervisorOptions(context),
    canManage: canManageTeams(context.profile.perfil),
    demoMode: context.demoMode,
    summary: {
      total: rows.length,
      active: rows.filter((row) => row.ativo).length,
      inactive: rows.filter((row) => !row.ativo).length,
      operators: rows.reduce((total, row) => total + row.operatorsCount, 0),
    },
  };
}

export async function criarEquipe(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente"]);
  const input = teamSchema.parse(rawInput);
  const context = await getClientsContext();

  if (!canManageTeams(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar equipes.");
  }

  const duplicated = context.teams.find(
    (team) => normalizeText(team.nome) === normalizeText(input.nome),
  );

  if (duplicated) {
    throw new Error("Ja existe uma equipe cadastrada com este nome.");
  }

  if (
    input.supervisorId &&
    !context.profiles.some((item) => item.id === input.supervisorId)
  ) {
    throw new Error("Supervisor fora do escopo permitido.");
  }

  if (!isSupabaseConfigured()) {
    return {
      teamId: `demo-team-${Date.now()}`,
      message: "Modo demonstracao: equipe validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      teamId: `demo-team-${Date.now()}`,
      message: "Modo demonstracao: equipe validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("equipes")
    .insert({
      nome: input.nome,
      supervisor_id: input.supervisorId ?? null,
      ativo: input.ativo ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel cadastrar a equipe."),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "equipe",
    entidadeId: data.id,
    acao: "equipe_criada",
    descricao: "Equipe cadastrada manualmente.",
    equipeId: data.id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosNovos: {
      nome: data.nome,
      supervisorId: data.supervisor_id,
      ativo: data.ativo,
    },
  });

  return {
    teamId: data.id,
    message: "Equipe cadastrada com sucesso.",
    demoMode: false,
  };
}

export async function atualizarEquipe(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente"]);
  const input = updateTeamSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.teams.find((team) => team.id === input.id);

  if (!canManageTeams(profile.perfil)) {
    throw new Error("Seu perfil nao pode editar equipes.");
  }

  if (!existing) {
    throw new Error("Equipe nao encontrada.");
  }

  const duplicated = context.teams.find(
    (team) =>
      team.id !== input.id && normalizeText(team.nome) === normalizeText(input.nome),
  );

  if (duplicated) {
    throw new Error("Ja existe outra equipe cadastrada com este nome.");
  }

  if (
    input.supervisorId &&
    !context.profiles.some((item) => item.id === input.supervisorId)
  ) {
    throw new Error("Supervisor fora do escopo permitido.");
  }

  if (!isSupabaseConfigured()) {
    return {
      teamId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      teamId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("equipes")
    .update({
      nome: input.nome,
      supervisor_id: input.supervisorId ?? null,
      ativo: input.ativo ?? existing.ativo,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar a equipe."),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "equipe",
    entidadeId: data.id,
    acao: "equipe_atualizada",
    descricao: "Equipe atualizada manualmente.",
    equipeId: data.id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      nome: existing.nome,
      supervisorId: existing.supervisor_id,
      ativo: existing.ativo,
    },
    dadosNovos: {
      nome: data.nome,
      supervisorId: data.supervisor_id,
      ativo: data.ativo,
    },
  });

  return {
    teamId: data.id,
    message: "Equipe atualizada com sucesso.",
    demoMode: false,
  };
}

export async function inativarEquipe(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente"]);
  const input = teamStatusSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.teams.find((team) => team.id === input.id);

  if (!canManageTeams(profile.perfil)) {
    throw new Error("Seu perfil nao pode alterar o status de equipes.");
  }

  if (!existing) {
    throw new Error("Equipe nao encontrada.");
  }

  if (!isSupabaseConfigured()) {
    return {
      teamId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      teamId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("equipes")
    .update({ ativo: input.ativo })
    .eq("id", existing.id)
    .select("id,nome,ativo")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(
        error?.message,
        "Nao foi possivel atualizar o status da equipe.",
      ),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "equipe",
    entidadeId: existing.id,
    acao: data.ativo ? "equipe_ativada" : "equipe_inativada",
    descricao: data.ativo
      ? "Equipe reativada manualmente."
      : "Equipe inativada manualmente.",
    equipeId: existing.id,
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
    teamId: existing.id,
    message: data.ativo
      ? "Equipe ativada com sucesso."
      : "Equipe inativada com sucesso.",
    demoMode: false,
  };
}

export function parseCreateTeamInput(payload: unknown) {
  return teamSchema.parse(payload);
}

export function parseUpdateTeamInput(payload: unknown) {
  return updateTeamSchema.parse(payload);
}

export function parseTeamStatusInput(payload: unknown) {
  return teamStatusSchema.parse(payload);
}
