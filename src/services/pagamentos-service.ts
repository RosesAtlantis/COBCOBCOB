import "server-only";

import { roundCurrency } from "@/lib/clientes-utils";
import { resolveNullableString } from "@/services/cadastros-utils";
import type { Database } from "@/types/database";

type PaymentInsert = Database["public"]["Tables"]["pagamentos"]["Insert"];

interface PaymentPayloadInput {
  dataPagamento: string;
  clienteId?: string | null;
  contratoId?: string | null;
  acordoId?: string | null;
  parcelaId?: string | null;
  baixaId?: string | null;
  carteiraId?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
  cpfCnpj?: string | null;
  contrato?: string | null;
  valorPago: number;
  valorHonorario?: number | null;
  valorEscritorio?: number | null;
  percentualHonorarios?: number | null;
  formaPagamento?: string | null;
  tipoReceita?: string | null;
  tipoReceitaOrigem?: string | null;
  origemArquivo?: string | null;
  origemManual?: boolean | null;
  origem?: string | null;
  importacaoId?: string | null;
  registradoPor?: string | null;
  atualizadoPor?: string | null;
  estornado?: boolean;
  estornadoEm?: string | null;
  estornadoPor?: string | null;
  motivoEstorno?: string | null;
}

function resolveNullableCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return roundCurrency(value);
}

function resolveNullablePercent(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return roundCurrency(value);
}

function omitUndefined<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as T;
}

export function sanitizePaymentPayload(payload: PaymentInsert) {
  return omitUndefined(payload);
}

export function buildPaymentMutationPayload(
  input: PaymentPayloadInput,
): PaymentInsert {
  const now = new Date().toISOString();

  return sanitizePaymentPayload({
    baixa_id: input.baixaId ?? null,
    acordo_id: input.acordoId ?? null,
    cliente_id: input.clienteId ?? null,
    contrato_id: input.contratoId ?? null,
    parcela_id: input.parcelaId ?? null,
    data_pagamento: input.dataPagamento,
    operador_id: input.operadorId ?? null,
    equipe_id: input.equipeId ?? null,
    carteira_id: input.carteiraId ?? null,
    cpf_cnpj: resolveNullableString(input.cpfCnpj),
    contrato: resolveNullableString(input.contrato),
    valor_pago: roundCurrency(input.valorPago),
    valor_honorario: roundCurrency(input.valorHonorario ?? 0),
    valor_escritorio: resolveNullableCurrency(input.valorEscritorio),
    percentual_honorarios: resolveNullablePercent(input.percentualHonorarios),
    forma_pagamento: resolveNullableString(input.formaPagamento),
    tipo_receita: resolveNullableString(input.tipoReceita),
    tipo_receita_origem: resolveNullableString(input.tipoReceitaOrigem),
    origem_arquivo: resolveNullableString(input.origemArquivo),
    origem_manual: input.origemManual ?? false,
    origem: resolveNullableString(input.origem),
    importacao_id: input.importacaoId ?? null,
    registrado_por: input.registradoPor ?? null,
    atualizado_por: input.atualizadoPor ?? null,
    estornado: input.estornado ?? false,
    estornado_em: input.estornadoEm ?? null,
    estornado_por: input.estornadoPor ?? null,
    motivo_estorno: resolveNullableString(input.motivoEstorno),
    atualizado_em: now,
  });
}
