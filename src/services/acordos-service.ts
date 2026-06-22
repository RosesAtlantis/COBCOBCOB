import "server-only";

import { z } from "zod";

import { getCurrentProfile, requireActiveProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { generateAgreementInstallments } from "@/lib/clientes-utils";
import {
  canCancelAgreements,
  canCreateAgreements,
  canRegisterAgreementPayments,
} from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AgreementInstallmentDraft,
  AgreementOperationResult,
  AgreementStatus,
  CreateAgreementInput,
} from "@/types/portal";

const createAgreementSchema = z.object({
  clienteId: z.string().uuid("Cliente invalido."),
  contratoId: z.string().uuid().nullable().optional(),
  operadorId: z.string().uuid().nullable().optional(),
  equipeId: z.string().uuid().nullable().optional(),
  carteiraId: z.string().uuid().nullable().optional(),
  dataAcordo: z.string().min(1, "Data do acordo obrigatoria."),
  valorOriginal: z.coerce.number().min(0, "Valor original invalido."),
  valorAcordo: z.coerce.number().positive("Valor do acordo obrigatorio."),
  valorEntrada: z.coerce.number().min(0, "Valor de entrada invalido.").default(0),
  dataVencimentoEntrada: z.string().nullable().optional(),
  quantidadeParcelas: z.coerce
    .number()
    .int()
    .min(1, "Quantidade de parcelas deve ser maior ou igual a 1."),
  valorParcela: z.coerce.number().positive().nullable().optional(),
  primeiroVencimento: z.string().nullable().optional(),
  formaPagamento: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
  status: z.string().trim().nullable().optional(),
});

const registerWriteOffSchema = z.object({
  acordoId: z.string().uuid("Acordo invalido."),
  parcelaId: z.string().uuid("Parcela invalida."),
  dataPagamento: z.string().min(1, "Data de pagamento obrigatoria."),
  valorPago: z.coerce
    .number()
    .min(0.01, "Valor pago deve ser maior que zero."),
  formaPagamento: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
});

const cancelAgreementSchema = z.object({
  acordoId: z.string().uuid("Acordo invalido."),
  observacao: z.string().trim().nullable().optional(),
});

function resolveNullableString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function getSupabaseForAgreementOperations() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createSupabaseServerClient();
}

async function readAgreementStatus(agreementId: string) {
  const supabase = await getSupabaseForAgreementOperations();

  if (!supabase) {
    return "ativo" satisfies AgreementStatus;
  }

  const { data, error } = await supabase
    .from("acordos")
    .select("status")
    .eq("id", agreementId)
    .single();

  if (error || !data?.status) {
    return "ativo" satisfies AgreementStatus;
  }

  return data.status as AgreementStatus;
}

export function gerarParcelasAcordo(
  input: Pick<
    CreateAgreementInput,
    | "valorAcordo"
    | "valorEntrada"
    | "quantidadeParcelas"
    | "valorParcela"
    | "dataVencimentoEntrada"
    | "primeiroVencimento"
  >,
): AgreementInstallmentDraft[] {
  return generateAgreementInstallments(input);
}

export async function criarAcordo(rawInput: unknown): Promise<AgreementOperationResult> {
  const profile = await requireActiveProfile();

  if (!canCreateAgreements(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar acordos.");
  }

  const input = createAgreementSchema.parse(rawInput);

  if (input.valorEntrada > input.valorAcordo) {
    throw new Error("Valor de entrada nao pode ser maior que o valor do acordo.");
  }

  const generatedInstallments = gerarParcelasAcordo({
    valorAcordo: input.valorAcordo,
    valorEntrada: input.valorEntrada,
    quantidadeParcelas: input.quantidadeParcelas,
    valorParcela: input.valorParcela ?? null,
    dataVencimentoEntrada: input.dataVencimentoEntrada ?? null,
    primeiroVencimento: input.primeiroVencimento ?? null,
  });

  if (!generatedInstallments.length) {
    throw new Error("Nao foi possivel gerar as parcelas do acordo.");
  }

  const supabase = await getSupabaseForAgreementOperations();

  if (!supabase) {
    return {
      agreementId: `demo-agreement-${Date.now()}`,
      status: input.status ?? "ativo",
      message:
        "Modo demonstracao: acordo validado e parcelas simuladas sem persistencia no banco.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase.rpc("portal_criar_acordo", {
    p_cliente_id: input.clienteId,
    p_contrato_id: input.contratoId ?? null,
    p_operador_id: input.operadorId ?? null,
    p_equipe_id: input.equipeId ?? null,
    p_carteira_id: input.carteiraId ?? null,
    p_data_acordo: input.dataAcordo,
    p_valor_original: input.valorOriginal,
    p_valor_acordo: input.valorAcordo,
    p_valor_entrada: input.valorEntrada,
    p_data_vencimento_entrada: input.dataVencimentoEntrada ?? null,
    p_quantidade_parcelas: input.quantidadeParcelas,
    p_valor_parcela: input.valorParcela ?? null,
    p_primeiro_vencimento: input.primeiroVencimento ?? null,
    p_forma_pagamento: resolveNullableString(input.formaPagamento),
    p_observacao: resolveNullableString(input.observacao),
    p_status: resolveNullableString(input.status),
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel cadastrar o acordo.");
  }

  return {
    agreementId: data,
    status: await readAgreementStatus(data),
    message: "Acordo cadastrado com parcelas geradas com sucesso.",
    demoMode: false,
  };
}

export async function darBaixaParcela(rawInput: unknown): Promise<AgreementOperationResult> {
  const profile = await requireActiveProfile();

  if (!canRegisterAgreementPayments(profile.perfil)) {
    throw new Error("Seu perfil nao pode registrar baixas.");
  }

  const input = registerWriteOffSchema.parse(rawInput);
  const supabase = await getSupabaseForAgreementOperations();

  if (!supabase) {
    return {
      agreementId: input.acordoId,
      writeOffId: `demo-baixa-${Date.now()}`,
      status: "parcial",
      message:
        "Modo demonstracao: baixa validada sem persistencia no banco.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase.rpc("portal_registrar_baixa", {
    p_acordo_id: input.acordoId,
    p_parcela_id: input.parcelaId,
    p_data_pagamento: input.dataPagamento,
    p_valor_pago: input.valorPago,
    p_forma_pagamento: resolveNullableString(input.formaPagamento),
    p_observacao: resolveNullableString(input.observacao),
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel registrar a baixa.");
  }

  return {
    agreementId: input.acordoId,
    writeOffId: data,
    status: await readAgreementStatus(input.acordoId),
    message: "Baixa registrada com sucesso.",
    demoMode: false,
  };
}

export async function cancelarAcordo(rawInput: unknown): Promise<AgreementOperationResult> {
  const profile = await requireActiveProfile();

  if (!canCancelAgreements(profile.perfil)) {
    throw new Error("Seu perfil nao pode cancelar acordos.");
  }

  const input = cancelAgreementSchema.parse(rawInput);
  const supabase = await getSupabaseForAgreementOperations();

  if (!supabase) {
    return {
      agreementId: input.acordoId,
      status: "cancelado",
      message:
        "Modo demonstracao: cancelamento validado sem persistencia no banco.",
      demoMode: true,
    };
  }

  const { data, error } = await supabase.rpc("portal_cancelar_acordo", {
    p_acordo_id: input.acordoId,
    p_observacao: resolveNullableString(input.observacao),
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel cancelar o acordo.");
  }

  return {
    agreementId: data,
    status: "cancelado",
    message: "Acordo cancelado com sucesso.",
    demoMode: false,
  };
}

export async function atualizarStatusAcordo(agreementId: string) {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Sessao invalida ou expirada.");
  }

  if (!agreementId.trim()) {
    throw new Error("Acordo invalido.");
  }

  const supabase = await getSupabaseForAgreementOperations();

  if (!supabase) {
    return "ativo" satisfies AgreementStatus;
  }

  const { data, error } = await supabase.rpc("refresh_acordo_status", {
    target_acordo_id: agreementId,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel atualizar o status do acordo.");
  }

  return data as AgreementStatus;
}

export function parseCreateAgreementInput(payload: unknown) {
  return createAgreementSchema.parse(payload);
}

export function parseWriteOffInput(payload: unknown) {
  return registerWriteOffSchema.parse(payload);
}

export function parseCancelAgreementInput(payload: unknown) {
  return cancelAgreementSchema.parse(payload);
}
