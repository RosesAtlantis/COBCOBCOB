import "server-only";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getMockPortalDataset } from "@/lib/mock-data";
import { canManageWallets } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registrarAuditoriaSegura } from "@/services/auditoria-service";
import {
  entityIdSchema,
  filterByQuery,
  formatMutationError,
  resolveNullableString,
} from "@/services/cadastros-utils";
import { getClientsContext } from "@/services/clientes-service";
import type { WalletRegistryPageData, WalletRegistryRow } from "@/types/portal";

const walletSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da carteira."),
  codigo: z.string().trim().nullable().optional(),
  descricao: z.string().trim().nullable().optional(),
  documento: z.string().trim().nullable().optional(),
  telefone: z.string().trim().nullable().optional(),
  email: z
    .string()
    .trim()
    .email("E-mail invalido.")
    .nullable()
    .optional()
    .or(z.literal("")),
  observacao: z.string().trim().nullable().optional(),
  ativo: z.boolean().optional(),
});

const updateWalletSchema = walletSchema.extend({
  id: entityIdSchema("Carteira invalida."),
});

const walletStatusSchema = z.object({
  id: entityIdSchema("Carteira invalida."),
  ativo: z.boolean(),
});

function buildWalletRows(
  context: Awaited<ReturnType<typeof getClientsContext>>,
): WalletRegistryRow[] {
  return context.wallets
    .map((wallet) => ({
      ...wallet,
      creditorName: resolveNullableString(wallet.credor) ?? wallet.nome,
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
      row.documento,
      row.telefone,
      row.email,
      row.observacao,
      row.creditorName,
      row.ativo ? "ativo" : "inativo",
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function hasDuplicateWallet(
  rows: WalletRegistryRow[],
  nome: string,
  excludedId?: string,
) {
  const normalizedInput = nome.trim().toLocaleLowerCase();

  return rows.some((row) => {
    if (row.id === excludedId) {
      return false;
    }

    return row.nome.trim().toLocaleLowerCase() === normalizedInput;
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

  if (hasDuplicateWallet(buildWalletRows(context), input.nome)) {
    throw new Error("Ja existe uma carteira com este nome.");
  }

  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const mock = getMockPortalDataset();
    const walletId = `demo-wallet-${Date.now()}`;

    mock.wallets.unshift({
      id: walletId,
      nome: input.nome.trim(),
      credor: input.nome.trim(),
      codigo: resolveNullableString(input.codigo),
      descricao: resolveNullableString(input.descricao),
      documento: resolveNullableString(input.documento),
      telefone: resolveNullableString(input.telefone),
      email: resolveNullableString(input.email),
      observacao: resolveNullableString(input.observacao),
      credor_id: null,
      ativo: input.ativo ?? true,
      criado_em: now,
      atualizado_em: now,
    });

    return {
      walletId,
      message: "Modo demonstracao: carteira cadastrada localmente.",
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
      documento: resolveNullableString(input.documento),
      telefone: resolveNullableString(input.telefone),
      email: resolveNullableString(input.email),
      observacao: resolveNullableString(input.observacao),
      credor: input.nome.trim(),
      credor_id: null,
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
      documento: data.documento,
      telefone: data.telefone,
      email: data.email,
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

  if (hasDuplicateWallet(buildWalletRows(context), input.nome, existing.id)) {
    throw new Error("Ja existe outra carteira com este nome.");
  }

  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const mock = getMockPortalDataset();
    const target = mock.wallets.find((wallet) => wallet.id === existing.id);

    if (target) {
      target.nome = input.nome.trim();
      target.codigo = resolveNullableString(input.codigo);
      target.descricao = resolveNullableString(input.descricao);
      target.documento = resolveNullableString(input.documento);
      target.telefone = resolveNullableString(input.telefone);
      target.email = resolveNullableString(input.email);
      target.observacao = resolveNullableString(input.observacao);
      target.credor = input.nome.trim();
      target.ativo = input.ativo ?? existing.ativo;
      target.atualizado_em = now;
    }

    return {
      walletId: existing.id,
      message: "Modo demonstracao: carteira atualizada localmente.",
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
      documento: resolveNullableString(input.documento),
      telefone: resolveNullableString(input.telefone),
      email: resolveNullableString(input.email),
      observacao: resolveNullableString(input.observacao),
      credor: input.nome.trim(),
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
        credor: data.nome,
      })
      .eq("carteira_id", data.id),
    supabase
      .from("contratos")
      .update({
        credor: data.nome || null,
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
      documento: existing.documento ?? null,
      telefone: existing.telefone ?? null,
      email: existing.email ?? null,
      credor: existing.credor,
      ativo: existing.ativo,
    },
    dadosNovos: {
      nome: data.nome,
      codigo: data.codigo,
      documento: data.documento,
      telefone: data.telefone,
      email: data.email,
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
    const mock = getMockPortalDataset();
    const target = mock.wallets.find((wallet) => wallet.id === existing.id);

    if (target) {
      target.ativo = input.ativo;
      target.atualizado_em = new Date().toISOString();
    }

    return {
      walletId: existing.id,
      message: "Modo demonstracao: status da carteira atualizado localmente.",
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
