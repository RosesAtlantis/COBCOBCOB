import "server-only";

import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { normalizeText } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { canManageProfiles, canViewProfiles } from "@/lib/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  registrarAuditoriaSegura,
  type CreateAuditEventInput,
} from "@/services/auditoria-service";
import {
  filterByQuery,
  formatMutationError,
} from "@/services/cadastros-utils";
import { getClientsContext, uniqueOptions } from "@/services/clientes-service";
import type {
  FilterOption,
  ProfileAuthUserOption,
  ProfileRegistryPageData,
  ProfileRegistryRow,
} from "@/types/portal";

const roleSchema = z.enum([
  "admin",
  "gerente",
  "supervisor",
  "operador",
  "financeiro",
]);

const createProfileSchema = z.object({
  userId: z.string().uuid("Usuario autenticado invalido."),
  nome: z.string().trim().min(2, "Informe o nome do usuario."),
  email: z.string().trim().email("E-mail invalido."),
  perfil: roleSchema,
  operadorId: z.string().uuid().nullable().optional(),
  equipeId: z.string().uuid().nullable().optional(),
  ativo: z.boolean().optional(),
});

const updateProfileSchema = createProfileSchema
  .omit({ userId: true })
  .extend({
    id: z.string().uuid("Perfil invalido."),
  });

const profileStatusSchema = z.object({
  id: z.string().uuid("Perfil invalido."),
  ativo: z.boolean(),
});

function buildProfileRows(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): ProfileRegistryRow[] {
  const operatorById = new Map(
    context.operators.map((operator) => [operator.id, operator.nome]),
  );
  const teamById = new Map(context.teams.map((team) => [team.id, team.nome]));

  return context.profiles
    .map((profile) => ({
      ...profile,
      operatorName: profile.operador_id
        ? operatorById.get(profile.operador_id) ?? null
        : null,
      teamName: profile.equipe_id ? teamById.get(profile.equipe_id) ?? null : null,
    }))
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

function filterProfileRows(rows: ProfileRegistryRow[], query?: string) {
  return filterByQuery(rows, query, (row) =>
    [
      row.nome,
      row.email,
      row.perfil,
      row.operatorName,
      row.teamName,
      row.ativo ? "ativo" : "inativo",
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildOperatorOptions(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): FilterOption[] {
  return uniqueOptions(
    context.operators.map((operator) => ({
      value: operator.id,
      label: operator.nome,
    })),
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

function resolveUserDisplayName(user: User) {
  const metadata = user.user_metadata;

  if (metadata && typeof metadata === "object") {
    const namedKeys = ["nome", "name", "full_name"] as const;

    for (const key of namedKeys) {
      const value = metadata[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  if (user.email) {
    return user.email;
  }

  return user.id;
}

async function buildAuthUserOptions(
  existingUserIds: Set<string>,
): Promise<ProfileAuthUserOption[]> {
  const adminClient = getSupabaseAdminClient();

  if (!adminClient) {
    return [];
  }

  const perPage = 200;
  let page = 1;
  const users: User[] = [];

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error || !data?.users.length) {
      break;
    }

    users.push(...data.users);

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return users
    .filter((user) => !existingUserIds.has(user.id))
    .map((user) => ({
      value: user.id,
      label: resolveUserDisplayName(user),
      email: user.email ?? "",
      description: user.email ?? "Usuario sem e-mail no Auth",
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function resolveScopedLinks(
  context: Awaited<ReturnType<typeof getClientsContext>>,
  payload: {
    operadorId?: string | null;
    equipeId?: string | null;
  },
) {
  const operator = payload.operadorId
    ? context.operators.find((item) => item.id === payload.operadorId)
    : null;
  const team = payload.equipeId
    ? context.teams.find((item) => item.id === payload.equipeId)
    : null;

  if (payload.operadorId && !operator) {
    throw new Error("Operador fora do escopo permitido.");
  }

  if (payload.equipeId && !team) {
    throw new Error("Equipe fora do escopo permitido.");
  }

  return {
    operadorId: operator?.id ?? null,
    equipeId: team?.id ?? operator?.equipe_id ?? null,
  };
}

async function assertAuthUserExists(userId: string) {
  const adminClient = getSupabaseAdminClient();

  if (!adminClient) {
    return;
  }

  const { data, error } = await adminClient.auth.admin.getUserById(userId);

  if (error || !data.user) {
    throw new Error("Usuario autenticado nao encontrado no Supabase Auth.");
  }
}

function profileAuditInput(
  base: Omit<CreateAuditEventInput, "entidade" | "entidadeId"> & {
    profileId: string;
  },
): CreateAuditEventInput {
  return {
    entidade: "profile",
    entidadeId: base.profileId,
    ...base,
  };
}

export async function listarProfiles(query?: string) {
  const context = await getClientsContext();
  return filterProfileRows(buildProfileRows(context), query);
}

export async function getProfilesPageData(
  query?: string,
): Promise<ProfileRegistryPageData> {
  const profile = await requireActiveProfile(["admin", "gerente"]);

  if (!canViewProfiles(profile.perfil)) {
    throw new Error("Seu perfil nao pode consultar usuarios.");
  }

  const context = await getClientsContext();
  const rows = filterProfileRows(buildProfileRows(context), query);
  const authUsers = context.demoMode
    ? []
    : await buildAuthUserOptions(new Set(context.profiles.map((item) => item.user_id)));

  return {
    profile: context.profile,
    profiles: rows,
    operators: buildOperatorOptions(context),
    teams: buildTeamOptions(context),
    authUsers,
    canManage: canManageProfiles(context.profile.perfil),
    demoMode: context.demoMode,
    serviceRoleAvailable: Boolean(getSupabaseAdminClient()),
    summary: {
      total: rows.length,
      active: rows.filter((row) => row.ativo).length,
      inactive: rows.filter((row) => !row.ativo).length,
      admins: rows.filter((row) => row.perfil === "admin").length,
    },
  };
}

export async function criarProfile(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin"]);
  const input = createProfileSchema.parse(rawInput);
  const context = await getClientsContext();

  if (!canManageProfiles(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar usuarios.");
  }

  if (context.profiles.some((item) => item.user_id === input.userId)) {
    throw new Error("Ja existe um profile cadastrado para este usuario autenticado.");
  }

  if (
    context.profiles.some(
      (item) =>
        normalizeText(item.email) === normalizeText(input.email),
    )
  ) {
    throw new Error("Ja existe um profile cadastrado com este e-mail.");
  }

  await assertAuthUserExists(input.userId);

  const resolvedLinks = resolveScopedLinks(context, input);

  if (!isSupabaseConfigured()) {
    return {
      profileId: `demo-profile-${Date.now()}`,
      message: "Modo demonstracao: usuario validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      profileId: `demo-profile-${Date.now()}`,
      message: "Modo demonstracao: usuario validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: input.userId,
      nome: input.nome,
      email: input.email,
      perfil: input.perfil,
      operador_id: resolvedLinks.operadorId,
      equipe_id: resolvedLinks.equipeId,
      ativo: input.ativo ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel cadastrar o usuario."),
    );
  }

  await registrarAuditoriaSegura(
    profileAuditInput({
      profileId: data.id,
      acao: "profile_criado",
      descricao: "Profile cadastrado manualmente na administracao.",
      usuarioId: profile.id,
      usuarioNome: profile.nome,
      origem: "manual",
      dadosNovos: {
        userId: data.user_id,
        nome: data.nome,
        email: data.email,
        perfil: data.perfil,
        operadorId: data.operador_id,
        equipeId: data.equipe_id,
        ativo: data.ativo,
      },
    }),
  );

  return {
    profileId: data.id,
    message: "Usuario cadastrado com sucesso.",
    demoMode: false,
  };
}

export async function atualizarProfile(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin"]);
  const input = updateProfileSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.profiles.find((item) => item.id === input.id);

  if (!canManageProfiles(profile.perfil)) {
    throw new Error("Seu perfil nao pode editar usuarios.");
  }

  if (!existing) {
    throw new Error("Profile nao encontrado.");
  }

  if (
    context.profiles.some(
      (item) =>
        item.id !== input.id &&
        normalizeText(item.email) === normalizeText(input.email),
    )
  ) {
    throw new Error("Ja existe outro profile cadastrado com este e-mail.");
  }

  const resolvedLinks = resolveScopedLinks(context, input);

  if (!isSupabaseConfigured()) {
    return {
      profileId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      profileId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      nome: input.nome,
      email: input.email,
      perfil: input.perfil,
      operador_id: resolvedLinks.operadorId,
      equipe_id: resolvedLinks.equipeId,
      ativo: input.ativo ?? existing.ativo,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar o usuario."),
    );
  }

  await registrarAuditoriaSegura(
    profileAuditInput({
      profileId: data.id,
      acao: "profile_atualizado",
      descricao: "Profile atualizado manualmente na administracao.",
      usuarioId: profile.id,
      usuarioNome: profile.nome,
      origem: "manual",
      dadosAnteriores: {
        nome: existing.nome,
        email: existing.email,
        perfil: existing.perfil,
        operadorId: existing.operador_id,
        equipeId: existing.equipe_id,
        ativo: existing.ativo,
      },
      dadosNovos: {
        nome: data.nome,
        email: data.email,
        perfil: data.perfil,
        operadorId: data.operador_id,
        equipeId: data.equipe_id,
        ativo: data.ativo,
      },
    }),
  );

  return {
    profileId: data.id,
    message: "Usuario atualizado com sucesso.",
    demoMode: false,
  };
}

export async function inativarProfile(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin"]);
  const input = profileStatusSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.profiles.find((item) => item.id === input.id);

  if (!canManageProfiles(profile.perfil)) {
    throw new Error("Seu perfil nao pode alterar o status de usuarios.");
  }

  if (!existing) {
    throw new Error("Profile nao encontrado.");
  }

  if (existing.id === profile.id && !input.ativo) {
    throw new Error("Voce nao pode inativar o proprio profile por esta tela.");
  }

  if (!isSupabaseConfigured()) {
    return {
      profileId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      profileId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ativo: input.ativo })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar o status do usuario."),
    );
  }

  await registrarAuditoriaSegura(
    profileAuditInput({
      profileId: data.id,
      acao: data.ativo ? "profile_ativado" : "profile_inativado",
      descricao: data.ativo
        ? "Profile reativado manualmente na administracao."
        : "Profile inativado manualmente na administracao.",
      usuarioId: profile.id,
      usuarioNome: profile.nome,
      origem: "manual",
      dadosAnteriores: {
        ativo: existing.ativo,
      },
      dadosNovos: {
        ativo: data.ativo,
      },
    }),
  );

  return {
    profileId: data.id,
    message: data.ativo
      ? "Usuario ativado com sucesso."
      : "Usuario inativado com sucesso.",
    demoMode: false,
  };
}

export function parseCreateProfileInput(payload: unknown) {
  return createProfileSchema.parse(payload);
}

export function parseUpdateProfileInput(payload: unknown) {
  return updateProfileSchema.parse(payload);
}

export function parseProfileStatusInput(payload: unknown) {
  return profileStatusSchema.parse(payload);
}
