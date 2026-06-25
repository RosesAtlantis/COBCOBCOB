import "server-only";

import { cache } from "react";
import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { normalizeText } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { getMockPortalDataset } from "@/lib/mock-data";
import { canManageCreditors, canViewCreditors } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatMutationError,
  resolveNullableString,
} from "@/services/cadastros-utils";
import type {
  Creditor,
  CreditorListRow,
  CreditorsPageData,
  PortalProfile,
  Wallet,
} from "@/types/portal";

const creditorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do credor."),
  codigo: z.string().trim().nullable().optional(),
  documento: z.string().trim().nullable().optional(),
  email: z
    .string()
    .trim()
    .email("E-mail invalido.")
    .nullable()
    .optional()
    .or(z.literal("")),
  telefone: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
  ativo: z.boolean().optional(),
});

const updateCreditorSchema = creditorSchema.extend({
  id: z.string().uuid("Credor invalido."),
});

const statusSchema = z.object({
  id: z.string().uuid("Credor invalido."),
  ativo: z.boolean(),
});

interface CreditorsContext {
  profile: PortalProfile;
  demoMode: boolean;
  creditors: Creditor[];
  wallets: Wallet[];
}

function walletsForCreditor(creditor: Creditor, wallets: Wallet[]) {
  return wallets.filter(
    (wallet) =>
      wallet.credor_id === creditor.id ||
      normalizeText(wallet.credor) === normalizeText(creditor.nome),
  );
}

function buildCreditorRows(context: CreditorsContext) {
  return context.creditors
    .map((creditor) => {
      const linkedWallets = walletsForCreditor(creditor, context.wallets);

      return {
        ...creditor,
        linkedWalletCount: linkedWallets.length,
        linkedWalletNames: linkedWallets.map((wallet) => wallet.nome),
      } satisfies CreditorListRow;
    })
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

function filterCreditorRows(rows: CreditorListRow[], query?: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) =>
    normalizeText(
      [
        row.nome,
        row.codigo,
        row.documento,
        row.email,
        row.telefone,
        row.observacao,
        row.ativo ? "ativo" : "inativo",
        ...row.linkedWalletNames,
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(normalizedQuery),
  );
}

const getCreditorsContext = cache(async (): Promise<CreditorsContext> => {
  const profile = await requireActiveProfile([
    "admin",
    "gerente",
    "supervisor",
    "financeiro",
  ]);

  if (!canViewCreditors(profile.perfil)) {
    throw new Error("Seu perfil nao pode consultar credores.");
  }

  if (!isSupabaseConfigured()) {
    const mock = getMockPortalDataset();

    return {
      profile,
      demoMode: true,
      creditors: mock.creditors,
      wallets: mock.wallets,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const mock = getMockPortalDataset();

    return {
      profile,
      demoMode: true,
      creditors: mock.creditors,
      wallets: mock.wallets,
    };
  }

  const [creditorsResult, walletsResult] = await Promise.all([
    supabase.from("credores").select("*").order("nome"),
    supabase.from("carteiras").select("*").order("nome"),
  ]);

  return {
    profile,
    demoMode: false,
    creditors: creditorsResult.data ?? [],
    wallets: walletsResult.data ?? [],
  };
});

export async function listarCredores(query?: string) {
  const context = await getCreditorsContext();
  return filterCreditorRows(buildCreditorRows(context), query);
}

export async function getCredoresPageData(query?: string): Promise<CreditorsPageData> {
  const context = await getCreditorsContext();
  const rows = filterCreditorRows(buildCreditorRows(context), query);

  return {
    profile: context.profile,
    creditors: rows,
    canManage: canManageCreditors(context.profile.perfil),
    demoMode: context.demoMode,
    summary: {
      total: rows.length,
      active: rows.filter((row) => row.ativo).length,
      inactive: rows.filter((row) => !row.ativo).length,
      linkedWallets: rows.reduce((total, row) => total + row.linkedWalletCount, 0),
    },
  };
}

export async function criarCredor(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = creditorSchema.parse(rawInput);

  if (!canManageCreditors(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar credores.");
  }

  const context = await getCreditorsContext();
  const duplicated = context.creditors.find(
    (creditor) => normalizeText(creditor.nome) === normalizeText(input.nome),
  );

  if (duplicated) {
    throw new Error("Ja existe um credor cadastrado com este nome.");
  }

  if (!isSupabaseConfigured()) {
    return {
      creditorId: `demo-creditor-${Date.now()}`,
      message: "Modo demonstracao: credor validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      creditorId: `demo-creditor-${Date.now()}`,
      message: "Modo demonstracao: credor validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("credores")
    .insert({
      nome: input.nome,
      codigo: resolveNullableString(input.codigo),
      documento: resolveNullableString(input.documento),
      email: resolveNullableString(input.email),
      telefone: resolveNullableString(input.telefone),
      observacao: resolveNullableString(input.observacao),
      ativo: input.ativo ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel cadastrar o credor."),
    );
  }

  const { registrarAuditoriaSegura } = await import("@/services/auditoria-service");
  await registrarAuditoriaSegura({
    entidade: "credor",
    entidadeId: data.id,
    acao: "credor_criado",
    descricao: "Credor cadastrado manualmente.",
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosNovos: {
      nome: data.nome,
      codigo: data.codigo,
      ativo: data.ativo,
    },
  });

  return {
    creditorId: data.id,
    message: "Credor cadastrado com sucesso.",
    demoMode: false,
  };
}

export async function criarCredorRapido(rawInput: unknown) {
  return criarCredor(rawInput);
}

export async function atualizarCredor(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = updateCreditorSchema.parse(rawInput);

  if (!canManageCreditors(profile.perfil)) {
    throw new Error("Seu perfil nao pode editar credores.");
  }

  const context = await getCreditorsContext();
  const existing = context.creditors.find((creditor) => creditor.id === input.id);
  const duplicated = context.creditors.find(
    (creditor) =>
      creditor.id !== input.id &&
      normalizeText(creditor.nome) === normalizeText(input.nome),
  );

  if (!existing) {
    throw new Error("Credor nao encontrado.");
  }

  if (duplicated) {
    throw new Error("Ja existe outro credor cadastrado com este nome.");
  }

  if (!isSupabaseConfigured()) {
    return {
      creditorId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      creditorId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("credores")
    .update({
      nome: input.nome,
      codigo: resolveNullableString(input.codigo),
      documento: resolveNullableString(input.documento),
      email: resolveNullableString(input.email),
      telefone: resolveNullableString(input.telefone),
      observacao: resolveNullableString(input.observacao),
      ativo: input.ativo ?? existing.ativo,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar o credor."),
    );
  }

  await Promise.all([
    supabase
      .from("carteiras")
      .update({ credor: data.nome })
      .eq("credor_id", data.id),
    supabase
      .from("cliente_carteiras")
      .update({ credor: data.nome })
      .eq("credor_id", data.id),
    supabase
      .from("contratos")
      .update({ credor: data.nome })
      .eq("credor_id", data.id),
  ]);

  const { registrarAuditoriaSegura } = await import("@/services/auditoria-service");
  await registrarAuditoriaSegura({
    entidade: "credor",
    entidadeId: data.id,
    acao: "credor_atualizado",
    descricao: "Credor atualizado manualmente.",
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      nome: existing.nome,
      codigo: existing.codigo,
      ativo: existing.ativo,
    },
    dadosNovos: {
      nome: data.nome,
      codigo: data.codigo,
      ativo: data.ativo,
    },
  });

  return {
    creditorId: data.id,
    message: "Credor atualizado com sucesso.",
    demoMode: false,
  };
}

export async function inativarCredor(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = statusSchema.parse(rawInput);

  if (!canManageCreditors(profile.perfil)) {
    throw new Error("Seu perfil nao pode alterar o status de credores.");
  }

  const context = await getCreditorsContext();
  const existing = context.creditors.find((creditor) => creditor.id === input.id);

  if (!existing) {
    throw new Error("Credor nao encontrado.");
  }

  if (!isSupabaseConfigured()) {
    return {
      creditorId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      creditorId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("credores")
    .update({ ativo: input.ativo })
    .eq("id", existing.id)
    .select("id,nome,ativo")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(
        error?.message,
        "Nao foi possivel atualizar o status do credor.",
      ),
    );
  }

  const { registrarAuditoriaSegura } = await import("@/services/auditoria-service");
  await registrarAuditoriaSegura({
    entidade: "credor",
    entidadeId: existing.id,
    acao: data.ativo ? "credor_ativado" : "credor_inativado",
    descricao: data.ativo
      ? "Credor reativado manualmente."
      : "Credor inativado manualmente.",
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
    creditorId: existing.id,
    message: data.ativo
      ? "Credor ativado com sucesso."
      : "Credor inativado com sucesso.",
    demoMode: false,
  };
}

export function parseCreateCreditorInput(payload: unknown) {
  return creditorSchema.parse(payload);
}

export function parseUpdateCreditorInput(payload: unknown) {
  return updateCreditorSchema.parse(payload);
}

export function parseCreditorStatusInput(payload: unknown) {
  return statusSchema.parse(payload);
}
