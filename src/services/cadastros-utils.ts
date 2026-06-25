import "server-only";

import { ZodError, z } from "zod";

import { normalizeText } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import {
  isValidCpfCnpj,
  isValidCpfCnpjLength,
  isValidPhoneLength,
} from "@/lib/validators";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const demoEntityIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/i;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const fieldLabels: Record<string, string> = {
  acordo: "Acordo",
  acordoId: "Acordo",
  acordo_id: "Acordo",
  carteira: "Carteira",
  carteiraId: "Carteira",
  carteira_id: "Carteira",
  cliente: "Cliente",
  clientId: "Cliente",
  clienteId: "Cliente",
  cliente_id: "Cliente",
  contrato: "Contrato",
  contractId: "Contrato",
  contratoId: "Contrato",
  contrato_id: "Contrato",
  cpfCnpj: "CPF/CNPJ",
  cpf_cnpj: "CPF/CNPJ",
  dataAcordo: "Data do acordo",
  data_acordo: "Data do acordo",
  dataContrato: "Data do contrato",
  data_contrato: "Data do contrato",
  dataPagamento: "Data de pagamento",
  data_pagamento: "Data de pagamento",
  dataVencimento: "Data de vencimento",
  data_vencimento: "Data de vencimento",
  dataVencimentoEntrada: "Data de vencimento da entrada",
  data_vencimento_entrada: "Data de vencimento da entrada",
  email: "E-mail",
  equipeId: "Equipe",
  equipe_id: "Equipe",
  formaPagamento: "Forma de pagamento",
  nome: "Nome",
  nome_cliente: "Nome",
  numeroContrato: "Numero do contrato",
  numero_contrato: "Numero do contrato",
  numeroParcela: "Parcela",
  numero_parcela: "Parcela",
  observacao: "Observacao",
  operadorId: "Operador",
  operador_id: "Operador",
  parcela: "Parcela",
  parcelaId: "Parcela",
  parcela_id: "Parcela",
  percentualHonorarios: "Percentual de honorarios",
  percentual_honorarios: "Percentual de honorarios",
  primeiroVencimento: "Primeiro vencimento",
  quantidadeParcelas: "Quantidade de parcelas",
  quantidade_parcelas: "Quantidade de parcelas",
  telefone: "Telefone",
  valorAcordo: "Valor do acordo",
  valor_acordo: "Valor do acordo",
  valorEmAberto: "Valor em aberto",
  valor_em_aberto: "Valor em aberto",
  valorEntrada: "Valor de entrada",
  valor_entrada: "Valor de entrada",
  valorOriginal: "Valor original",
  valor_original: "Valor original",
  valorPago: "Valor pago",
  valor_pago: "Valor pago",
  valorParcela: "Valor da parcela",
  valor_parcela: "Valor da parcela",
};

function isSupportedEntityId(value: string) {
  return uuidPattern.test(value) || (!isSupabaseConfigured() && demoEntityIdPattern.test(value));
}

export function entityIdSchema(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => isSupportedEntityId(value), message);
}

export function documentFieldSchema() {
  return z
    .string()
    .trim()
    .refine(
      (value) => isValidCpfCnpjLength(value),
      "CPF/CNPJ invalido. Informe 11 digitos para CPF ou 14 para CNPJ.",
    )
    .refine((value) => isValidCpfCnpj(value), "CPF/CNPJ invalido.");
}

export function optionalPhoneFieldSchema() {
  return z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (value) => !value || isValidPhoneLength(value),
      "Telefone invalido. Informe 10 ou 11 digitos.",
    );
}

export function isValidDateInput(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  if (!dateOnlyPattern.test(trimmed)) {
    return false;
  }

  const date = new Date(`${trimmed}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === trimmed;
}

export function optionalDateFieldSchema(message: string) {
  return z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((value) => !value || isValidDateInput(value), message);
}

export function payloadToRecord(payload: unknown) {
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {};
}

export function pickPayloadValue(
  payload: Record<string, unknown>,
  aliases: string[],
) {
  for (const alias of aliases) {
    if (payload[alias] !== undefined) {
      return payload[alias];
    }
  }

  return undefined;
}

function resolveFieldLabel(path: PropertyKey[]) {
  const lastKey = path.at(-1);
  return lastKey ? fieldLabels[String(lastKey)] ?? String(lastKey) : "campo informado";
}

function formatZodIssue(error: ZodError) {
  const firstIssue = error.issues[0];

  if (!firstIssue) {
    return "Revise os dados informados e tente novamente.";
  }

  if (
    firstIssue.message &&
    !firstIssue.message.startsWith("Invalid input") &&
    !firstIssue.message.startsWith("[")
  ) {
    return firstIssue.message;
  }

  const label = resolveFieldLabel(firstIssue.path);

  if (firstIssue.code === "invalid_type") {
    return `Nao foi possivel salvar. O campo ${label} nao foi identificado. Atualize a pagina e tente novamente.`;
  }

  if (firstIssue.code === "too_small") {
    return `Revise o campo ${label} e tente novamente.`;
  }

  if (firstIssue.code === "invalid_value") {
    return `O campo ${label} possui um valor invalido.`;
  }

  return `Revise o campo ${label} e tente novamente.`;
}

export function resolveNullableString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function resolveNullableNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value;
}

export function filterByQuery<T>(
  rows: T[],
  query: string | undefined,
  getSearchText: (row: T) => string,
) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) => normalizeText(getSearchText(row)).includes(normalizedQuery));
}

export function formatMutationError(message: string | undefined, fallback: string) {
  const normalized = normalizeText(message);

  if (!normalized) {
    return fallback;
  }

  if (
    normalized.includes("row level security") ||
    normalized.includes("row-level security") ||
    normalized.includes("permission denied")
  ) {
    return "Seu perfil nao possui permissao para concluir este cadastro.";
  }

  if (normalized.includes("duplicate key")) {
    return "Ja existe um registro com estes dados principais.";
  }

  return message ? `${fallback} Detalhes: ${message}` : fallback;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return formatZodIssue(error);
  }

  if (!(error instanceof Error) || !error.message.trim()) {
    return fallback;
  }

  const normalized = normalizeText(error.message);

  if (
    normalized.includes("row level security") ||
    normalized.includes("row-level security") ||
    normalized.includes("permission denied")
  ) {
    return "Seu perfil nao possui permissao para concluir esta operacao.";
  }

  if (normalized.includes("duplicate key")) {
    return "Ja existe um cadastro com esses dados principais.";
  }

  if (normalized.includes("invalid input")) {
    return "Revise os dados obrigatorios e tente novamente.";
  }

  return error.message;
}
