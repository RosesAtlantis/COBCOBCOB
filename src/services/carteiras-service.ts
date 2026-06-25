import "server-only";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { normalizeText } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { canManageWallets } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registrarAuditoriaSegura } from "@/services/auditoria-service";
import {
  filterByQuery,
  formatMutationError,
  resolveNullableString,
} from "@/services/cadastros-utils";
import { getClientsContext, uniqueOptions } from "@/services/clientes-service";
import type {
  FilterOption,
  WalletRegistryPageData,
  WalletRegistryRow,
} from "@/types/portal";

const walletSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da carteira."),
  credorId: z.string().uuid().nullable().optional(),
  credor: z.string().trim().nullable().optional(),
  codigo: z.string().trim().nullable().optional(),
  descricao: z.string().trim().nullable().optional(),
  ativo: z.boolean().optional(),
});

const updateWalletSchema = walletSchema.extend({
  id: z.string().uuid("Carteira invalida."),
});

const walletStatusSchema = z.object({
  id: z.string().uuid("Carteira invalida."),
  ativo: z.boolean(),
});

function buildWalletRows(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): WalletRegistryRow[] {
  const creditorById = new Map(
    context.creditors.map((creditor) => [creditor.id, creditor.nome]),
  );

  return context.wallets
    .map((wallet) => ({
      ...wallet,
      creditorName:
        (wallet.credor_id ? creditorById.get(wallet.credor_id) : null) ??
        resolveNullableString(wallet.credor) ??
        "Sem credor vinculado",
      linkedClients: context.walletLinks.filter(
        (link) => link.carteira_id === wallet.id && link.ativo,
      ).length,
      linkedContracts: context.contracts.filter(
        (contract) => contract.carteira_id === wallet.id,
      ).length,
    }))
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

function filterWalletRows(rows: WalletRegistryRow[], query?: string) {
  return filterByQuery(rows, query, (row) =>
    [
      row.nome,
      row.codigo,
      row.descricao,
      row.creditorName,
      row.ativo ? "ativo" : "inativo",
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildCreditorOptions(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): FilterOption[] {
  return uniqueOptions(
    context.creditors.map((creditor) => ({
      value: creditor.id,
      label: creditor.nome,
      description: creditor.codigo ?? undefined,
    })),
  );
}

function resolveCreditor(
  context: Awaited<ReturnType<typeof getClientsContext>>,
  payload: {
    credorId?: string | null;
    credorName?: string | null;
  },
) {
  const creditorById = new Map(context.creditors.map((creditor) => [creditor.id, creditor]));
  const creditorByName = new Map(
    context.creditors.map((creditor) => [normalizeText(creditor.nome), creditor]),
  );

  const selectedById = payload.credorId ? creditorById.get(payload.credorId) : null;
  const selectedByName = payload.credorName
    ? creditorByName.get(normalizeText(payload.credorName))
    : null;

  if (payload.credorId && !selectedById) {
    throw new Error("Credor nao encontrado para o perfil atual.");
  }

  const resolved = selectedById ?? selectedByName ?? null;

  return {
    creditorId: resolved?.id ?? null,
    creditorName: resolved?.nome ?? resolveNullableString(payload.credorName) ?? null,
  };
}

function hasDuplicateWallet(
  rows: WalletRegistryRow[],
  input: {
    nome: string;
    creditorName: string | null;
  },
  excludedId?: string,
) {
  const inputKey = `${normalizeText(input.nome)}::${normalizeText(input.creditorName)}`;

  return rows.some((row) => {
    if (row.id === excludedId) {
      return false;
    }

    const rowKey = `${normalizeText(row.nome)}::${normalizeText(row.creditorName)}`;
    return rowKey === inputKey;
  });
}

export async function listarCarteiras(query?: string) {
  const profile = await requireActiveProfile([
    "admin",
    "gerente",
    "supervisor",
    "financeiro",
  ]);
  const context = await getClientsContext();

  if (!["admin", "gerente", "supervisor", "financeiro"].includes(profile.perfil)) {
    throw new Error("Seu perfil nao pode consultar carteiras.");
  }

  return filterWalletRows(buildWalletRows(context), query);
}

export async function getCarteirasPageData(
  query?: string,
): Promise<WalletRegistryPageData> {
  const context = await getClientsContext();
  const rows = filterWalletRows(buildWalletRows(context), query);

  return {
    profile: context.profile,
    wallets: rows,
    creditors: buildCreditorOptions(context),
    canManage: canManageWallets(context.profile.perfil),
    demoMode: context.demoMode,
    summary: {
      total: rows.length,
      active: rows.filter((row) => row.ativo).length,
      inactive: rows.filter((row) => !row.ativo).length,
      linkedClients: rows.reduce((total, row) => total + row.linkedClients, 0),
    },
  };
}

export async function criarCarteira(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = walletSchema.parse(rawInput);
  const context = await getClientsContext();

  if (!canManageWallets(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar carteiras.");
  }

  const resolvedCreditor = resolveCreditor(context, {
    credorId: input.credorId ?? null,
    credorName: input.credor ?? null,
  });

  if (
    hasDuplicateWallet(buildWalletRows(context), {
      nome: input.nome,
      creditorName: resolvedCreditor.creditorName,
    })
  ) {
    throw new Error("Ja existe uma carteira com este nome para o credor informado.");
  }

  if (!isSupabaseConfigured()) {
    return {
      walletId: `demo-wallet-${Date.now()}`,
      message: "Modo demonstracao: carteira validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      walletId: `demo-wallet-${Date.now()}`,
      message: "Modo demonstracao: carteira validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("carteiras")
    .insert({
      nome: input.nome,
      codigo: resolveNullableString(input.codigo),
      descricao: resolveNullableString(input.descricao),
      credor: resolvedCreditor.creditorName ?? "",
      credor_id: resolvedCreditor.creditorId,
      ativo: input.ativo ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel cadastrar a carteira."),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "carteira",
    entidadeId: data.id,
    acao: "carteira_criada",
    descricao: "Carteira cadastrada manualmente.",
    carteiraId: data.id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosNovos: {
      nome: data.nome,
      codigo: data.codigo,
      credor: data.credor,
      ativo: data.ativo,
    },
  });

  return {
    walletId: data.id,
    message: "Carteira cadastrada com sucesso.",
    demoMode: false,
  };
}

export async function atualizarCarteira(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = updateWalletSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.wallets.find((wallet) => wallet.id === input.id);

  if (!canManageWallets(profile.perfil)) {
    throw new Error("Seu perfil nao pode editar carteiras.");
  }

  if (!existing) {
    throw new Error("Carteira nao encontrada.");
  }

  const resolvedCreditor = resolveCreditor(context, {
    credorId: input.credorId ?? existing.credor_id ?? null,
    credorName: input.credor ?? existing.credor ?? null,
  });

  if (
    hasDuplicateWallet(
      buildWalletRows(context),
      {
        nome: input.nome,
        creditorName: resolvedCreditor.creditorName,
      },
      existing.id,
    )
  ) {
    throw new Error("Ja existe outra carteira com este nome para o credor informado.");
  }

  if (!isSupabaseConfigured()) {
    return {
      walletId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      walletId: existing.id,
      message: "Modo demonstracao: atualizacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("carteiras")
    .update({
      nome: input.nome,
      codigo: resolveNullableString(input.codigo),
      descricao: resolveNullableString(input.descricao),
      credor: resolvedCreditor.creditorName ?? "",
      credor_id: resolvedCreditor.creditorId,
      ativo: input.ativo ?? existing.ativo,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(error?.message, "Nao foi possivel atualizar a carteira."),
    );
  }

  await Promise.all([
    supabase
      .from("cliente_carteiras")
      .update({
        credor: data.credor,
        credor_id: data.credor_id,
      })
      .eq("carteira_id", data.id),
    supabase
      .from("contratos")
      .update({
        credor: data.credor || null,
        credor_id: data.credor_id,
      })
      .eq("carteira_id", data.id),
  ]);

  await registrarAuditoriaSegura({
    entidade: "carteira",
    entidadeId: data.id,
    acao: "carteira_atualizada",
    descricao: "Carteira atualizada manualmente.",
    carteiraId: data.id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      nome: existing.nome,
      codigo: existing.codigo ?? null,
      credor: existing.credor,
      ativo: existing.ativo,
    },
    dadosNovos: {
      nome: data.nome,
      codigo: data.codigo,
      credor: data.credor,
      ativo: data.ativo,
    },
  });

  return {
    walletId: data.id,
    message: "Carteira atualizada com sucesso.",
    demoMode: false,
  };
}

export async function inativarCarteira(rawInput: unknown) {
  const profile = await requireActiveProfile(["admin", "gerente", "financeiro"]);
  const input = walletStatusSchema.parse(rawInput);
  const context = await getClientsContext();
  const existing = context.wallets.find((wallet) => wallet.id === input.id);

  if (!canManageWallets(profile.perfil)) {
    throw new Error("Seu perfil nao pode alterar o status de carteiras.");
  }

  if (!existing) {
    throw new Error("Carteira nao encontrada.");
  }

  if (!isSupabaseConfigured()) {
    return {
      walletId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      walletId: existing.id,
      message: "Modo demonstracao: status validado sem persistencia.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("carteiras")
    .update({ ativo: input.ativo })
    .eq("id", existing.id)
    .select("id,nome,ativo")
    .single();

  if (error || !data) {
    throw new Error(
      formatMutationError(
        error?.message,
        "Nao foi possivel atualizar o status da carteira.",
      ),
    );
  }

  await registrarAuditoriaSegura({
    entidade: "carteira",
    entidadeId: existing.id,
    acao: data.ativo ? "carteira_ativada" : "carteira_inativada",
    descricao: data.ativo
      ? "Carteira reativada manualmente."
      : "Carteira inativada manualmente.",
    carteiraId: existing.id,
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
    walletId: existing.id,
    message: data.ativo
      ? "Carteira ativada com sucesso."
      : "Carteira inativada com sucesso.",
    demoMode: false,
  };
}

export function parseCreateWalletInput(payload: unknown) {
  return walletSchema.parse(payload);
}

export function parseUpdateWalletInput(payload: unknown) {
  return updateWalletSchema.parse(payload);
}

export function parseWalletStatusInput(payload: unknown) {
  return walletStatusSchema.parse(payload);
}
