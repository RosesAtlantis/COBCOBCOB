import "server-only";

import { z } from "zod";

import { getCurrentProfile, requireActiveProfile } from "@/lib/auth";
import {
  deriveInstallmentStatus,
  generateAgreementInstallments,
  getPrimaryWalletLabel,
  matchesClientSearch,
  normalizeText,
  roundCurrency,
} from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import {
  canViewAgreementCentral,
  canCancelAgreements,
  canCreateAgreements,
  canRegisterAgreementPayments,
  canReverseAgreementPayments,
} from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listarHistoricoAcordo,
  registrarAuditoria,
} from "@/services/auditoria-service";
import {
  entityIdSchema,
  isValidDateInput,
  optionalDateFieldSchema,
  payloadToRecord,
  pickPayloadValue,
} from "@/services/cadastros-utils";
import {
  criarContratoDuranteAcordo,
  criarContratoDuranteBaixa,
} from "@/services/contratos-service";
import {
  calcularHonorarios,
  calcularClassificacaoAutomaticaParcela,
  classificarParcelas,
  classificarTipoReceita,
} from "@/services/honorarios-service";
import {
  buildResolvedCollections,
  getClientsContext,
  uniqueOptions,
  type ClientsContext,
} from "@/services/clientes-service";
import type {
  AgreementCenterFilterOptions,
  AgreementCenterFilters,
  AgreementCenterPageData,
  AgreementCenterRow,
  AgreementDetailData,
  AgreementInstallmentDraft,
  AgreementOperationResult,
  AgreementStatus,
  CreateAgreementInput,
  UpdateInstallmentRevenueTypeInput,
  WriteOffCenterRow,
} from "@/types/portal";
import type { Database } from "@/types/database";
import { parseCurrencyBR, parseInteger, parsePercent } from "@/lib/validators";

type AgreementInsert = Database["public"]["Tables"]["acordos"]["Insert"];

const flowContractSchema = z.object({
  numeroContrato: z.string().trim().min(1, "Numero do contrato obrigatorio."),
  carteiraId: entityIdSchema("Carteira invalida."),
  credor: z.string().trim().nullable().optional(),
  credorId: entityIdSchema("Credor invalido.").nullable().optional(),
  valorOriginal: z.coerce.number().min(0, "Valor original invalido.").nullable().optional(),
  valorEmAberto: z.coerce.number().min(0, "Valor em aberto invalido.").nullable().optional(),
  dataContrato: optionalDateFieldSchema("Data do contrato invalida."),
  dataVencimento: optionalDateFieldSchema("Data de vencimento invalida."),
  operadorId: entityIdSchema("Operador invalido.").nullable().optional(),
  equipeId: entityIdSchema("Equipe invalida.").nullable().optional(),
  status: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
});

const createAgreementSchema = z.object({
  clienteId: entityIdSchema("Cliente invalido."),
  contratoId: entityIdSchema("Contrato invalido.").nullable().optional(),
  operadorId: entityIdSchema("Operador invalido.").nullable().optional(),
  equipeId: entityIdSchema("Equipe invalida.").nullable().optional(),
  carteiraId: entityIdSchema("Carteira invalida.").nullable().optional(),
  dataAcordo: z
    .string()
    .trim()
    .min(1, "Data do acordo obrigatoria.")
    .refine((value) => isValidDateInput(value), "Data do acordo invalida."),
  valorOriginal: z.coerce.number().min(0, "Valor original invalido."),
  valorAcordo: z.coerce.number().positive("Valor do acordo obrigatorio."),
  valorEntrada: z.coerce.number().min(0, "Valor de entrada invalido.").default(0),
  dataVencimentoEntrada: optionalDateFieldSchema("Data de vencimento da entrada invalida."),
  quantidadeParcelas: z.coerce
    .number()
    .int()
    .min(1, "Quantidade de parcelas deve ser maior ou igual a 1.")
    .max(120, "Quantidade de parcelas deve ser menor ou igual a 120."),
  valorParcela: z.coerce.number().positive().nullable().optional(),
  primeiroVencimento: z
    .string()
    .trim()
    .min(1, "Primeiro vencimento obrigatorio.")
    .refine((value) => isValidDateInput(value), "Primeiro vencimento invalido."),
  intervaloMeses: z.coerce.number().int().min(1).max(120).nullable().optional(),
  percentualHonorarios: z.coerce.number().min(0).max(100).nullable().optional(),
  formaPagamento: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
  status: z.string().trim().nullable().optional(),
  criarContratoAgora: z.coerce.boolean().optional(),
  novoContrato: flowContractSchema.nullable().optional(),
  parcelasCustomizadas: z
    .array(
      z.object({
        numeroParcela: z.coerce.number().int().min(1),
        tipo: z.enum(["entrada", "parcela", "avista"]),
        dataVencimento: z
          .string()
          .trim()
          .min(1)
          .refine((value) => isValidDateInput(value), "Data da parcela invalida."),
        valorParcela: z.coerce.number().positive(),
        observacao: z.string().trim().nullable().optional(),
        operadorId: entityIdSchema("Operador invalido.").nullable().optional(),
        tipoReceita: z.enum(["NOVO", "COLCHAO"]).nullable().optional(),
        tipoReceitaOrigem: z.enum(["automatico", "manual"]).nullable().optional(),
      }),
    )
    .optional(),
});

const registerWriteOffSchema = z.object({
  acordoId: entityIdSchema("Acordo invalido."),
  parcelaId: entityIdSchema("Parcela invalida."),
  dataPagamento: z
    .string()
    .trim()
    .min(1, "Data de pagamento obrigatoria.")
    .refine((value) => isValidDateInput(value), "Data de pagamento invalida."),
  valorPago: z.coerce
    .number()
    .min(0.01, "Valor pago deve ser maior que zero."),
  operadorId: entityIdSchema("Operador invalido.").nullable().optional(),
  percentualHonorarios: z.coerce.number().min(0).max(100).nullable().optional(),
  confirmarAcimaSaldo: z.coerce.boolean().optional(),
  formaPagamento: z.string().trim().min(1, "Informe a forma de pagamento."),
  observacao: z.string().trim().nullable().optional(),
  criarContratoAgora: z.coerce.boolean().optional(),
  novoContrato: flowContractSchema.nullable().optional(),
});

const cancelAgreementSchema = z.object({
  acordoId: entityIdSchema("Acordo invalido."),
  observacao: z.string().trim().nullable().optional(),
});

const updateInstallmentRevenueTypeSchema = z.object({
  parcelaId: entityIdSchema("Parcela invalida."),
  tipoReceita: z.enum(["NOVO", "COLCHAO"]),
});

function normalizeMoneyField(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parseCurrencyBR(value as string | number | null | undefined);
  return parsed === null ? value : parsed;
}

function normalizeIntegerField(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parseInteger(value as string | number | null | undefined);
  return parsed === null ? value : parsed;
}

function normalizePercentField(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parsePercent(value as string | number | null | undefined);
  return parsed === null ? value : parsed;
}

function omitUndefined<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as T;
}

function normalizeFlowContractPayload(payload: unknown) {
  if (payload === null || payload === undefined) {
    return undefined;
  }

  const record = payloadToRecord(payload);

  if (!Object.keys(record).length) {
    return undefined;
  }

  return {
    numeroContrato: pickPayloadValue(record, ["numeroContrato", "numero_contrato"]),
    carteiraId: pickPayloadValue(record, ["carteiraId", "carteira_id"]),
    credor: pickPayloadValue(record, ["credor"]),
    credorId: pickPayloadValue(record, ["credorId", "credor_id"]),
    valorOriginal: normalizeMoneyField(
      pickPayloadValue(record, ["valorOriginal", "valor_original"]),
    ),
    valorEmAberto: normalizeMoneyField(
      pickPayloadValue(record, ["valorEmAberto", "valor_em_aberto"]),
    ),
    dataContrato: pickPayloadValue(record, ["dataContrato", "data_contrato"]),
    dataVencimento: pickPayloadValue(record, ["dataVencimento", "data_vencimento"]),
    operadorId: pickPayloadValue(record, ["operadorId", "operador_id"]),
    equipeId: pickPayloadValue(record, ["equipeId", "equipe_id"]),
    status: pickPayloadValue(record, ["status"]),
    observacao: pickPayloadValue(record, ["observacao"]),
  };
}

function normalizeInstallmentDraftPayload(payload: unknown) {
  const record = payloadToRecord(payload);

  return {
    numeroParcela: normalizeIntegerField(
      pickPayloadValue(record, ["numeroParcela", "numero_parcela"]),
    ),
    tipo: pickPayloadValue(record, ["tipo"]),
    dataVencimento: pickPayloadValue(record, ["dataVencimento", "data_vencimento"]),
    valorParcela: normalizeMoneyField(
      pickPayloadValue(record, ["valorParcela", "valor_parcela"]),
    ),
    observacao: pickPayloadValue(record, ["observacao"]),
    operadorId: pickPayloadValue(record, ["operadorId", "operador_id"]),
    tipoReceita: pickPayloadValue(record, ["tipoReceita", "tipo_receita"]),
    tipoReceitaOrigem: pickPayloadValue(record, [
      "tipoReceitaOrigem",
      "tipo_receita_origem",
    ]),
  };
}

function normalizeCreateAgreementPayload(payload: unknown) {
  const record = payloadToRecord(payload);
  const parcels = pickPayloadValue(record, ["parcelasCustomizadas", "parcelas_customizadas"]);

  return {
    clienteId: pickPayloadValue(record, [
      "clienteId",
      "cliente_id",
      "clientId",
      "cliente",
    ]),
    contratoId: pickPayloadValue(record, ["contratoId", "contrato_id"]),
    operadorId: pickPayloadValue(record, ["operadorId", "operador_id"]),
    equipeId: pickPayloadValue(record, ["equipeId", "equipe_id"]),
    carteiraId: pickPayloadValue(record, ["carteiraId", "carteira_id"]),
    dataAcordo: pickPayloadValue(record, ["dataAcordo", "data_acordo"]),
    valorOriginal: normalizeMoneyField(
      pickPayloadValue(record, ["valorOriginal", "valor_original"]),
    ),
    valorAcordo: normalizeMoneyField(
      pickPayloadValue(record, ["valorAcordo", "valor_acordo"]),
    ),
    valorEntrada: normalizeMoneyField(
      pickPayloadValue(record, ["valorEntrada", "valor_entrada"]),
    ),
    dataVencimentoEntrada: pickPayloadValue(record, [
      "dataVencimentoEntrada",
      "data_vencimento_entrada",
    ]),
    quantidadeParcelas: normalizeIntegerField(
      pickPayloadValue(record, ["quantidadeParcelas", "quantidade_parcelas"]),
    ),
    valorParcela: normalizeMoneyField(
      pickPayloadValue(record, ["valorParcela", "valor_parcela"]),
    ),
    primeiroVencimento: pickPayloadValue(record, [
      "primeiroVencimento",
      "primeiro_vencimento",
    ]),
    intervaloMeses: normalizeIntegerField(
      pickPayloadValue(record, ["intervaloMeses", "intervalo_meses"]),
    ),
    percentualHonorarios: normalizePercentField(
      pickPayloadValue(record, ["percentualHonorarios", "percentual_honorarios"]),
    ),
    formaPagamento: pickPayloadValue(record, ["formaPagamento", "forma_pagamento"]),
    observacao: pickPayloadValue(record, ["observacao"]),
    status: pickPayloadValue(record, ["status"]),
    criarContratoAgora: pickPayloadValue(record, [
      "criarContratoAgora",
      "criar_contrato_agora",
    ]),
    novoContrato: normalizeFlowContractPayload(
      pickPayloadValue(record, ["novoContrato", "novo_contrato"]),
    ),
    parcelasCustomizadas: Array.isArray(parcels)
      ? parcels.map((item) => normalizeInstallmentDraftPayload(item))
      : undefined,
  };
}

function normalizeWriteOffPayload(payload: unknown) {
  const record = payloadToRecord(payload);

  return {
    acordoId: pickPayloadValue(record, ["acordoId", "acordo_id"]),
    parcelaId: pickPayloadValue(record, ["parcelaId", "parcela_id"]),
    dataPagamento: pickPayloadValue(record, ["dataPagamento", "data_pagamento"]),
    valorPago: normalizeMoneyField(
      pickPayloadValue(record, ["valorPago", "valor_pago"]),
    ),
    operadorId: pickPayloadValue(record, ["operadorId", "operador_id"]),
    percentualHonorarios: normalizePercentField(
      pickPayloadValue(record, ["percentualHonorarios", "percentual_honorarios"]),
    ),
    confirmarAcimaSaldo: pickPayloadValue(record, [
      "confirmarAcimaSaldo",
      "confirmar_acima_saldo",
    ]),
    formaPagamento: pickPayloadValue(record, ["formaPagamento", "forma_pagamento"]),
    observacao: pickPayloadValue(record, ["observacao"]),
    criarContratoAgora: pickPayloadValue(record, [
      "criarContratoAgora",
      "criar_contrato_agora",
    ]),
    novoContrato: normalizeFlowContractPayload(
      pickPayloadValue(record, ["novoContrato", "novo_contrato"]),
    ),
  };
}

function normalizeCancelAgreementPayload(payload: unknown) {
  const record = payloadToRecord(payload);

  return {
    acordoId: pickPayloadValue(record, ["acordoId", "acordo_id"]),
    observacao: pickPayloadValue(record, ["observacao"]),
  };
}

function normalizeRevenueTypePayload(payload: unknown) {
  const record = payloadToRecord(payload);

  return {
    parcelaId: pickPayloadValue(record, ["parcelaId", "parcela_id"]),
    tipoReceita: pickPayloadValue(record, ["tipoReceita", "tipo_receita"]),
  };
}

function resolveNullableString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function resolveAgreementModel(
  installments: AgreementInstallmentDraft[],
  entryValue: number,
): "avista" | "entrada_parcelas" | "parcelado" {
  const firstInstallment = installments[0] ?? null;

  if (firstInstallment?.tipo === "avista" && installments.length === 1) {
    return "avista";
  }

  if (entryValue > 0) {
    return "entrada_parcelas";
  }

  return "parcelado";
}

function resolveAgreementScope(
  context: ClientsContext,
  payload: {
    requestedOperatorId?: string | null;
    requestedTeamId?: string | null;
    fallbackOperatorId?: string | null;
    fallbackTeamId?: string | null;
  },
) {
  const operator = payload.requestedOperatorId
    ? context.operators.find((item) => item.id === payload.requestedOperatorId)
    : null;
  const team = payload.requestedTeamId
    ? context.teams.find((item) => item.id === payload.requestedTeamId)
    : null;

  if (payload.requestedOperatorId && !operator) {
    throw new Error("Operador fora do escopo permitido.");
  }

  if (payload.requestedTeamId && !team) {
    throw new Error("Equipe fora do escopo permitido.");
  }

  return {
    operadorId:
      operator?.id ??
      payload.fallbackOperatorId ??
      context.profile.operador_id ??
      null,
    equipeId:
      team?.id ??
      operator?.equipe_id ??
      payload.fallbackTeamId ??
      context.profile.equipe_id ??
      null,
  };
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

function pickLatestDate(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function buildAgreementFilterOptions(
  context: ClientsContext,
): AgreementCenterFilterOptions {
  return {
    wallets: uniqueOptions(
      context.wallets.map((wallet) => ({
        value: wallet.id,
        label: wallet.nome,
        description: wallet.credor,
      })),
    ),
    creditors: uniqueOptions(
      context.wallets.map((wallet) => ({
        value: wallet.credor,
        label: wallet.credor,
      })),
    ),
    teams: uniqueOptions(
      context.teams.map((team) => ({
        value: team.id,
        label: team.nome,
      })),
    ),
    operators: uniqueOptions(
      context.operators.map((operator) => ({
        value: operator.id,
        label: operator.nome,
      })),
    ),
    statuses: [
      { value: "ativo", label: "Ativo" },
      { value: "aguardando_pagamento", label: "Aguardando pagamento" },
      { value: "parcial", label: "Parcial" },
      { value: "atrasado", label: "Atrasado" },
      { value: "quitado", label: "Quitado" },
      { value: "cancelado", label: "Cancelado" },
      { value: "quebrado", label: "Quebrado" },
      { value: "andamento", label: "Em andamento" },
      { value: "formalizado", label: "Formalizado" },
    ],
  };
}

export function buildAgreementCenterRows(
  context: ClientsContext,
): AgreementCenterRow[] {
  const resolved = buildResolvedCollections(context);

  return resolved.resolvedAgreements.map((agreement) => {
    const client = agreement.cliente_id
      ? resolved.clientById.get(agreement.cliente_id)
      : undefined;
    const wallet = agreement.carteira_id
      ? resolved.walletById.get(agreement.carteira_id)
      : undefined;
    const installments = [...agreement.resolvedInstallments].sort(
      (left, right) => left.numero_parcela - right.numero_parcela,
    );
    const parcelasPagas = installments.filter(
      (item) => deriveInstallmentStatus(item) === "pago",
    ).length;
    const parcelasPendentes = installments.filter(
      (item) => deriveInstallmentStatus(item) === "pendente",
    ).length;
    const parcelasAtrasadas = installments.filter(
      (item) => deriveInstallmentStatus(item) === "atrasado",
    ).length;

    return {
      id: agreement.id,
      clientId: client?.id ?? agreement.cliente_id ?? null,
      walletId: agreement.carteira_id ?? null,
      operatorId: agreement.operador_id ?? null,
      teamId: agreement.equipe_id ?? null,
      cliente: client?.nome ?? "Cliente nao vinculado",
      cpfCnpj: client?.cpf_cnpj ?? agreement.cpf_cnpj ?? "-",
      contrato: agreement.contrato ?? "-",
      carteira: wallet?.nome ?? getPrimaryWalletLabel(null, wallet?.credor ?? null),
      credor: wallet?.credor ?? "-",
      operador: agreement.operador_id
        ? resolved.operatorById.get(agreement.operador_id)?.nome ?? "-"
        : "-",
      equipe: agreement.equipe_id
        ? resolved.teamById.get(agreement.equipe_id)?.nome ?? "-"
        : "-",
      dataAcordo: agreement.data_acordo,
      valorOriginal: agreement.valor_original,
      valorAcordo: agreement.valor_acordo,
      valorPago: agreement.valor_pago,
      saldo: agreement.remainingValue,
      percentualHonorarios: agreement.percentual_honorarios ?? null,
      valorHonorariosPrevisto: agreement.valor_honorarios_previsto ?? null,
      valorEscritorioPrevisto: agreement.valor_escritorio_previsto ?? null,
      parcelas: installments.length,
      parcelasPagas,
      parcelasPendentes,
      parcelasAtrasadas,
      status: agreement.resolvedStatus,
      formaPagamento: agreement.forma_pagamento,
      observacao: agreement.observacao,
      ultimoPagamentoEm: agreement.ultimo_pagamento_em,
      ultimaAtualizacao:
        pickLatestDate([
          agreement.atualizado_em,
          agreement.ultimo_pagamento_em,
          ...installments.map((item) => item.atualizado_em),
        ]) ?? agreement.atualizado_em,
      parcelasDetalhe: installments,
    } satisfies AgreementCenterRow;
  });
}

function filterAgreementRows(
  rows: AgreementCenterRow[],
  filters: AgreementCenterFilters,
) {
  const normalizedQuery = normalizeText(filters.query);

  return rows
    .filter((row) => {
      const matchesQuery =
        matchesClientSearch(filters.query ?? "", {
          name: row.cliente,
          document: row.cpfCnpj,
          contractNumbers: [row.contrato],
        }) ||
        (!normalizedQuery
          ? true
          : [row.carteira, row.credor, row.operador, row.equipe].some((value) =>
              normalizeText(value).includes(normalizedQuery),
            ));

      return (
        matchesQuery &&
        (!filters.status || row.status === filters.status) &&
        (!filters.walletId || row.walletId === filters.walletId) &&
        (!filters.creditor ||
          normalizeText(row.credor) === normalizeText(filters.creditor)) &&
        (!filters.teamId || row.teamId === filters.teamId) &&
        (!filters.operatorId || row.operatorId === filters.operatorId) &&
        (!filters.startDate || row.dataAcordo >= filters.startDate) &&
        (!filters.endDate || row.dataAcordo <= filters.endDate) &&
        (typeof filters.minValue !== "number" || row.valorAcordo >= filters.minValue) &&
        (typeof filters.maxValue !== "number" || row.valorAcordo <= filters.maxValue)
      );
    })
    .sort((left, right) => right.dataAcordo.localeCompare(left.dataAcordo));
}

function buildAgreementSummary(rows: AgreementCenterRow[]) {
  const ativos = rows.filter((row) =>
    [
      "ativo",
      "aguardando_pagamento",
      "parcial",
      "atrasado",
      "andamento",
      "formalizado",
    ].includes(row.status),
  ).length;

  return {
    ativos,
    totalAcordado: roundCurrency(
      rows.reduce((total, row) => total + row.valorAcordo, 0),
    ),
    pago: roundCurrency(rows.reduce((total, row) => total + row.valorPago, 0)),
    saldoEmAberto: roundCurrency(rows.reduce((total, row) => total + row.saldo, 0)),
    parcelasVencidas: rows.reduce((total, row) => total + row.parcelasAtrasadas, 0),
    acordosQuitados: rows.filter((row) => row.status === "quitado").length,
    cancelados: rows.filter((row) => row.status === "cancelado").length,
    honorariosPrevistos: roundCurrency(
      rows.reduce((total, row) => total + (row.valorHonorariosPrevisto ?? 0), 0),
    ),
    valorEscritorioPrevisto: roundCurrency(
      rows.reduce((total, row) => total + (row.valorEscritorioPrevisto ?? 0), 0),
    ),
  };
}

function buildAgreementWriteOffRows(context: ClientsContext, agreementId: string) {
  const resolved = buildResolvedCollections(context);
  const agreement = resolved.agreementById.get(agreementId);

  if (!agreement) {
    return [] satisfies WriteOffCenterRow[];
  }

  const client = agreement.cliente_id
    ? resolved.clientById.get(agreement.cliente_id)
    : undefined;
  const wallet = agreement.carteira_id
    ? resolved.walletById.get(agreement.carteira_id)
    : undefined;

  return resolved.resolvedWriteOffs
    .filter((writeOff) => writeOff.acordo_id === agreementId)
    .map((writeOff) => {
      const installment = agreement.resolvedInstallments.find(
        (item) => item.id === writeOff.parcela_id,
      );
      const registeredBy = writeOff.registrado_por
        ? resolved.profileById.get(writeOff.registrado_por)?.nome ?? "Portal BKO"
        : "Portal BKO";
      const reversedBy = writeOff.estornada_por
        ? resolved.profileById.get(writeOff.estornada_por)?.nome ?? "Portal BKO"
        : null;

      return {
        id: writeOff.id,
        agreementId: writeOff.acordo_id,
        parcelId: writeOff.parcela_id,
        clientId: client?.id ?? agreement.cliente_id ?? null,
        walletId: agreement.carteira_id ?? null,
        operatorId: agreement.operador_id ?? null,
        teamId: agreement.equipe_id ?? null,
        cliente: client?.nome ?? "Cliente nao vinculado",
        cpfCnpj: client?.cpf_cnpj ?? agreement.cpf_cnpj ?? "-",
        acordo: agreement.id,
        contrato: agreement.contrato ?? "-",
        numeroParcela: installment?.numero_parcela ?? 0,
        carteira: wallet?.nome ?? getPrimaryWalletLabel(null, wallet?.credor ?? null),
        credor: wallet?.credor ?? "-",
        operador: agreement.operador_id
          ? resolved.operatorById.get(agreement.operador_id)?.nome ?? "-"
          : "-",
        equipe: agreement.equipe_id
          ? resolved.teamById.get(agreement.equipe_id)?.nome ?? "-"
          : "-",
        dataPagamento: writeOff.data_pagamento,
        valorPago: writeOff.valor_pago,
        formaPagamento: writeOff.forma_pagamento,
        registradoPor: registeredBy,
        registradoPorId: writeOff.registrado_por,
        dataRegistro: writeOff.criado_em,
        observacao: writeOff.observacao,
        percentualHonorarios: writeOff.percentual_honorarios ?? null,
        valorHonorarios: writeOff.valor_honorarios ?? null,
        valorEscritorio: writeOff.valor_escritorio ?? null,
        tipoReceita: writeOff.tipo_receita ?? null,
        tipoReceitaOrigem: writeOff.tipo_receita_origem ?? null,
        estornada: writeOff.estornada,
        estornadaEm: writeOff.estornada_em,
        estornadaPor: reversedBy,
        motivoEstorno: writeOff.motivo_estorno,
      } satisfies WriteOffCenterRow;
    })
    .sort((left, right) => right.dataPagamento.localeCompare(left.dataPagamento));
}

export async function listarAcordos(filters: AgreementCenterFilters = {}) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);
  const context = await getClientsContext();

  if (!canViewAgreementCentral(context.profile.perfil)) {
    return [] satisfies AgreementCenterRow[];
  }

  return filterAgreementRows(buildAgreementCenterRows(context), filters);
}

export async function buscarAcordoPorId(agreementId: string) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);

  if (!agreementId.trim()) {
    return null;
  }

  const context = await getClientsContext();
  const row = buildAgreementCenterRows(context).find((agreement) => agreement.id === agreementId);

  if (!row) {
    return null;
  }

  const auditTrail = await listarHistoricoAcordo(agreementId);
  const writeOffs = buildAgreementWriteOffRows(context, agreementId);

  return {
    id: row.id,
    clientId: row.clientId,
    cliente: row.cliente,
    cpfCnpj: row.cpfCnpj,
    contrato: row.contrato,
    carteira: row.carteira,
    credor: row.credor,
    operador: row.operador,
    equipe: row.equipe,
    dataAcordo: row.dataAcordo,
    valorOriginal: row.valorOriginal,
    valorAcordo: row.valorAcordo,
    valorPago: row.valorPago,
    saldo: row.saldo,
    percentualHonorarios: row.percentualHonorarios ?? null,
    valorHonorariosPrevisto: row.valorHonorariosPrevisto ?? null,
    valorEscritorioPrevisto: row.valorEscritorioPrevisto ?? null,
    status: row.status,
    formaPagamento: row.formaPagamento,
    observacao: row.observacao,
    ultimoPagamentoEm: row.ultimoPagamentoEm,
    parcelasPagas: row.parcelasPagas,
    parcelasPendentes: row.parcelasPendentes,
    parcelasAtrasadas: row.parcelasAtrasadas,
    parcelas: row.parcelasDetalhe,
    writeOffs,
    auditTrail,
    canCancel: canCancelAgreements(context.profile.perfil),
    canRegisterWriteOff: canRegisterAgreementPayments(context.profile.perfil),
    canReverseWriteOff: canReverseAgreementPayments(context.profile.perfil),
    demoMode: context.demoMode,
  } satisfies AgreementDetailData;
}

export async function getAcordosPageData(
  filters: AgreementCenterFilters = {},
): Promise<AgreementCenterPageData> {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);
  const context = await getClientsContext();
  const agreements = filterAgreementRows(buildAgreementCenterRows(context), filters);

  return {
    profile: context.profile,
    filters,
    options: buildAgreementFilterOptions(context),
    summary: buildAgreementSummary(agreements),
    agreements,
    canCancelAgreement: canCancelAgreements(context.profile.perfil),
    canRegisterWriteOff: canRegisterAgreementPayments(context.profile.perfil),
    canReverseWriteOff: canReverseAgreementPayments(context.profile.perfil),
    demoMode: context.demoMode,
  };
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
    | "intervaloMeses"
    | "parcelasCustomizadas"
  >,
): AgreementInstallmentDraft[] {
  return classificarParcelas(generateAgreementInstallments(input));
}

export async function criarAcordo(rawInput: unknown): Promise<AgreementOperationResult> {
  const profile = await requireActiveProfile();

  if (!canCreateAgreements(profile.perfil)) {
    throw new Error("Seu perfil nao pode cadastrar acordos.");
  }

  const input = parseCreateAgreementInput(rawInput);

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
    intervaloMeses: input.intervaloMeses ?? 1,
    parcelasCustomizadas: input.parcelasCustomizadas ?? [],
  });

  if (!generatedInstallments.length) {
    throw new Error("Nao foi possivel gerar as parcelas do acordo.");
  }

  const context = await getClientsContext();
  const client = context.clients.find((item) => item.id === input.clienteId);

  if (!client) {
    throw new Error("Cliente nao encontrado.");
  }

  let contract =
    input.contratoId
      ? context.contracts.find(
          (item) => item.id === input.contratoId && item.cliente_id === client.id,
        ) ?? null
      : null;
  const shouldCreateContractNow =
    !contract && Boolean(input.criarContratoAgora || input.novoContrato);

  const scope = resolveAgreementScope(context, {
    requestedOperatorId: input.operadorId ?? null,
    requestedTeamId: input.equipeId ?? null,
    fallbackOperatorId: contract?.operador_id ?? client.operador_id,
    fallbackTeamId: contract?.equipe_id ?? client.equipe_id,
  });
  const contractWalletId = contract?.carteira_id ?? null;
  let wallet =
    (input.carteiraId
      ? context.wallets.find((item) => item.id === input.carteiraId)
      : null) ??
    (input.novoContrato?.carteiraId
      ? context.wallets.find((item) => item.id === input.novoContrato?.carteiraId)
      : null) ??
    (contractWalletId
      ? context.wallets.find((item) => item.id === contractWalletId)
      : null) ??
    null;

  if (!wallet) {
    throw new Error("Selecione uma carteira valida para o acordo.");
  }

  if (shouldCreateContractNow) {
    if (!input.novoContrato) {
      throw new Error("Preencha os dados do contrato para continuar com o acordo.");
    }

    const createdContract = await criarContratoDuranteAcordo({
      clientId: client.id,
      numeroContrato: input.novoContrato.numeroContrato,
      carteiraId: input.novoContrato.carteiraId,
      credor: input.novoContrato.credor ?? wallet.credor,
      credorId: input.novoContrato.credorId ?? wallet.credor_id ?? null,
      valorOriginal:
        input.novoContrato.valorOriginal ?? input.valorOriginal ?? input.valorAcordo,
      valorEmAberto: input.novoContrato.valorEmAberto,
      dataContrato: input.novoContrato.dataContrato ?? null,
      dataVencimento: input.novoContrato.dataVencimento ?? null,
      operadorId: input.novoContrato.operadorId ?? scope.operadorId,
      equipeId: input.novoContrato.equipeId ?? scope.equipeId,
      status: input.novoContrato.status ?? null,
      observacao: input.novoContrato.observacao ?? input.observacao ?? null,
    });

    if (createdContract.contract) {
      contract = createdContract.contract;
      wallet =
        context.wallets.find((item) => item.id === createdContract.contract?.carteira_id) ??
        wallet;
    }
  }

  const feePreview = calcularHonorarios({
    valorBase: input.valorAcordo,
    percentualHonorarios: input.percentualHonorarios ?? null,
    carteira: wallet,
  });
  const agreementModel = resolveAgreementModel(generatedInstallments, input.valorEntrada);
  const firstBalanceInstallment =
    generatedInstallments.find((installment) => installment.tipo !== "entrada") ??
    generatedInstallments[0] ??
    null;
  const resolvedAgreementStatus =
    resolveNullableString(input.status) ??
    (generatedInstallments[0]?.tipo === "entrada" || generatedInstallments.length === 1
      ? "aguardando_pagamento"
      : "ativo");
  const agreementInsertPayload = omitUndefined<AgreementInsert>({
    cliente_id: client.id,
    contrato_id: contract?.id ?? null,
    carteira_id: wallet.id,
    credor_id: wallet.credor_id ?? null,
    credor: resolveNullableString(wallet.credor),
    operador_id: scope.operadorId,
    equipe_id: scope.equipeId,
    cpf_cnpj: resolveNullableString(client.cpf_cnpj),
    contrato: resolveNullableString(contract?.numero_contrato ?? null),
    data_acordo: input.dataAcordo,
    valor_original: roundCurrency(input.valorOriginal),
    valor_acordo: roundCurrency(input.valorAcordo),
    valor_entrada: roundCurrency(input.valorEntrada),
    data_vencimento_entrada:
      input.valorEntrada > 0 ? resolveNullableString(input.dataVencimentoEntrada) : null,
    quantidade_parcelas: input.quantidadeParcelas,
    valor_parcela: roundCurrency(firstBalanceInstallment?.valorParcela ?? 0),
    primeiro_vencimento: resolveNullableString(
      firstBalanceInstallment?.dataVencimento ?? input.primeiroVencimento ?? null,
    ),
    forma_pagamento: resolveNullableString(input.formaPagamento),
    modelo_acordo: agreementModel,
    tipo_acordo: agreementModel,
    percentual_honorarios: feePreview.percentualHonorarios,
    valor_honorarios_previsto: feePreview.valorHonorarios,
    valor_escritorio_previsto: feePreview.valorEscritorio,
    status: resolvedAgreementStatus,
    observacao: resolveNullableString(input.observacao),
    criado_por: profile.id,
    valor_pago: 0,
    intervalo_meses: input.intervaloMeses ?? 1,
    origem_manual: true,
  });
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

  const { error: clientUpdateError } = await supabase
    .from("clientes")
    .update({
      operador_id: scope.operadorId,
      equipe_id: scope.equipeId,
    })
    .eq("id", client.id);

  if (clientUpdateError) {
    throw new Error(clientUpdateError.message);
  }

  const { error: walletLinkError } = await supabase.from("cliente_carteiras").upsert(
    {
      cliente_id: client.id,
      carteira_id: wallet.id,
      credor: wallet.credor,
      credor_id: wallet.credor_id ?? null,
      ativo: true,
    },
    { onConflict: "cliente_id,carteira_id" },
  );

  if (walletLinkError) {
    throw new Error(walletLinkError.message);
  }

  if (contract) {
    const { error: contractUpdateError } = await supabase
      .from("contratos")
      .update({
        carteira_id: wallet.id,
        credor: wallet.credor,
        credor_id: wallet.credor_id ?? null,
        operador_id: scope.operadorId,
        equipe_id: scope.equipeId,
        status: roundCurrency(contract.valor_em_aberto) <= 0 ? "quitado" : "em_acordo",
      })
      .eq("id", contract.id);

    if (contractUpdateError) {
      throw new Error(contractUpdateError.message);
    }
  }

  const { data: createdAgreement, error } = await supabase
    .from("acordos")
    .insert(agreementInsertPayload)
    .select("*")
    .single();

  if (error || !createdAgreement) {
    throw new Error(error?.message ?? "Nao foi possivel cadastrar o acordo.");
  }

  const installmentRows = classificarParcelas(generatedInstallments).map((installment) => {
    const parcelFee = calcularHonorarios({
      valorBase: installment.valorParcela,
      percentualHonorarios: feePreview.percentualHonorarios,
      percentualEscritorio: feePreview.percentualEscritorio,
      carteira: wallet,
    });
    const revenue = classificarTipoReceita({
      numeroParcela: installment.numeroParcela,
      tipo: installment.tipo,
      manualType: installment.tipoReceita ?? null,
    });

    return {
      acordo_id: createdAgreement.id,
      numero_parcela: installment.numeroParcela,
      tipo: installment.tipo,
      data_vencimento: installment.dataVencimento,
      valor_parcela: roundCurrency(installment.valorParcela),
      valor_pago: 0,
      status:
        installment.dataVencimento < new Date().toISOString().slice(0, 10)
          ? "atrasado"
          : "pendente",
      observacao: resolveNullableString(installment.observacao),
      operador_id: installment.operadorId ?? scope.operadorId,
      equipe_id: scope.equipeId,
      percentual_honorarios: parcelFee.percentualHonorarios,
      valor_honorarios_previsto: parcelFee.valorHonorarios,
      valor_escritorio_previsto: parcelFee.valorEscritorio,
      tipo_receita: installment.tipoReceita ?? revenue.tipoReceita,
      tipo_receita_origem:
        installment.tipoReceitaOrigem ??
        (installment.tipoReceita ? "manual" : revenue.tipoReceitaOrigem),
      origem_manual: true,
    };
  });

  const { error: installmentError } = await supabase
    .from("acordo_parcelas")
    .insert(installmentRows);

  if (installmentError) {
    throw new Error(installmentError.message);
  }

  await supabase.rpc("refresh_acordo_status", {
    target_acordo_id: createdAgreement.id,
  });

  await registrarAuditoria({
    entidade: "acordo",
    entidadeId: createdAgreement.id,
    acao: "acordo_criado",
    descricao: resolveNullableString(input.observacao) ?? "Acordo criado no Portal BKO.",
    acordoId: createdAgreement.id,
    clienteId: client.id,
    contratoId: contract?.id ?? null,
    operadorId: scope.operadorId,
    equipeId: scope.equipeId,
    carteiraId: wallet.id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosNovos: {
      valorAcordo: createdAgreement.valor_acordo,
      percentualHonorarios: createdAgreement.percentual_honorarios,
      quantidadeParcelas: createdAgreement.quantidade_parcelas,
    },
  });

  return {
    agreementId: createdAgreement.id,
    status: await readAgreementStatus(createdAgreement.id),
    message: "Acordo cadastrado com parcelas geradas com sucesso.",
    demoMode: false,
  };
}

export async function darBaixaParcela(rawInput: unknown): Promise<AgreementOperationResult> {
  const profile = await requireActiveProfile();

  if (!canRegisterAgreementPayments(profile.perfil)) {
    throw new Error("Seu perfil nao pode registrar baixas.");
  }

  const input = parseWriteOffInput(rawInput);
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

  const [agreementResult, parcelResult] = await Promise.all([
    supabase.from("acordos").select("*").eq("id", input.acordoId).single(),
    supabase
      .from("acordo_parcelas")
      .select("*")
      .eq("id", input.parcelaId)
      .eq("acordo_id", input.acordoId)
      .single(),
  ]);

  if (agreementResult.error || !agreementResult.data) {
    throw new Error(agreementResult.error?.message ?? "Acordo nao encontrado.");
  }

  if (parcelResult.error || !parcelResult.data) {
    throw new Error(parcelResult.error?.message ?? "Parcela nao encontrada.");
  }

  let agreement = agreementResult.data;
  const parcel = parcelResult.data;

  if (agreement.status === "cancelado") {
    throw new Error("Acordos cancelados nao podem receber baixa.");
  }

  if (parcel.status === "cancelado") {
    throw new Error("Parcelas canceladas nao podem receber baixa.");
  }

  const remainingBalance = roundCurrency(parcel.valor_parcela - parcel.valor_pago);

  if (input.valorPago > remainingBalance && !input.confirmarAcimaSaldo) {
    throw new Error("O valor pago nao pode ser maior que o saldo sem confirmacao explicita.");
  }

  const context = await getClientsContext();
  const client = agreement.cliente_id
    ? context.clients.find((item) => item.id === agreement.cliente_id) ?? null
    : null;
  let wallet = agreement.carteira_id
    ? context.wallets.find((item) => item.id === agreement.carteira_id) ?? null
    : null;
  const resolvedOperatorId = input.operadorId ?? parcel.operador_id ?? agreement.operador_id;
  const resolvedTeamId = parcel.equipe_id ?? agreement.equipe_id;

  if (!agreement.contrato_id) {
    if (!input.criarContratoAgora || !input.novoContrato) {
      throw new Error(
        "Este acordo ainda nao possui contrato. Crie um contrato antes de concluir a baixa.",
      );
    }

    if (!client) {
      throw new Error("Cliente nao encontrado para vincular o novo contrato.");
    }

    const createdContract = await criarContratoDuranteBaixa({
      clientId: client.id,
      agreementId: agreement.id,
      numeroContrato: input.novoContrato.numeroContrato,
      carteiraId: input.novoContrato.carteiraId,
      credor: wallet?.credor ?? null,
      credorId: wallet?.credor_id ?? null,
      valorOriginal:
        input.novoContrato.valorOriginal ??
        roundCurrency(Math.max(parcel.valor_parcela, agreement.valor_original ?? 0)),
      valorEmAberto:
        input.novoContrato.valorEmAberto ??
        roundCurrency(Math.max(parcel.valor_parcela - parcel.valor_pago, 0)),
      dataContrato: input.novoContrato.dataContrato ?? null,
      dataVencimento: input.novoContrato.dataVencimento ?? parcel.data_vencimento ?? null,
      operadorId: input.novoContrato.operadorId ?? resolvedOperatorId,
      equipeId: input.novoContrato.equipeId ?? resolvedTeamId,
      status: input.novoContrato.status ?? "em_acordo",
      observacao: input.novoContrato.observacao ?? input.observacao ?? null,
    });

    if (createdContract.contract) {
      const { error: linkContractError } = await supabase
        .from("acordos")
        .update({
          contrato_id: createdContract.contract.id,
          contrato: createdContract.contract.numero_contrato,
          carteira_id: createdContract.contract.carteira_id ?? agreement.carteira_id,
          credor_id: createdContract.contract.credor_id ?? wallet?.credor_id ?? agreement.credor_id,
          credor: resolveNullableString(
            createdContract.contract.credor ?? wallet?.credor ?? agreement.credor ?? null,
          ),
          cpf_cnpj: agreement.cpf_cnpj ?? client.cpf_cnpj,
        })
        .eq("id", agreement.id);

      if (linkContractError) {
        throw new Error(linkContractError.message);
      }

      agreement = {
        ...agreement,
        contrato_id: createdContract.contract.id,
        contrato: createdContract.contract.numero_contrato,
        carteira_id: createdContract.contract.carteira_id ?? agreement.carteira_id,
        credor_id: createdContract.contract.credor_id ?? wallet?.credor_id ?? agreement.credor_id,
        credor:
          createdContract.contract.credor ?? wallet?.credor ?? agreement.credor ?? null,
        cpf_cnpj: agreement.cpf_cnpj ?? client.cpf_cnpj,
      };
      wallet = agreement.carteira_id
        ? context.wallets.find((item) => item.id === agreement.carteira_id) ?? wallet
        : wallet;
    }
  }

  const feeCalculation = calcularHonorarios({
    valorBase: input.valorPago,
    percentualHonorarios:
      input.percentualHonorarios ??
      parcel.percentual_honorarios ??
      agreement.percentual_honorarios ??
      null,
    carteira: wallet,
  });
  const revenue = classificarTipoReceita({
    numeroParcela: parcel.numero_parcela,
    tipo: parcel.tipo,
    manualType: parcel.tipo_receita ?? null,
  });
  const updatedPaidAmount = roundCurrency(parcel.valor_pago + input.valorPago);
  const nextParcelStatus =
    updatedPaidAmount >= roundCurrency(parcel.valor_parcela)
      ? "pago"
      : parcel.data_vencimento < new Date().toISOString().slice(0, 10)
        ? "atrasado"
        : "pendente";

  const { data: createdWriteOff, error: writeOffError } = await supabase
    .from("acordo_baixas")
    .insert({
      acordo_id: agreement.id,
      parcela_id: parcel.id,
      cliente_id: agreement.cliente_id,
      data_pagamento: input.dataPagamento,
      valor_pago: roundCurrency(input.valorPago),
      forma_pagamento: resolveNullableString(input.formaPagamento),
      observacao: resolveNullableString(input.observacao),
      operador_id: resolvedOperatorId,
      equipe_id: resolvedTeamId,
      percentual_honorarios: feeCalculation.percentualHonorarios,
      valor_honorarios: feeCalculation.valorHonorarios,
      valor_escritorio: feeCalculation.valorEscritorio,
      tipo_receita: revenue.tipoReceita,
      tipo_receita_origem: revenue.tipoReceitaOrigem,
      registrado_por: profile.id,
      importacao_id: agreement.importacao_id ?? null,
    })
    .select("*")
    .single();

  if (writeOffError || !createdWriteOff) {
    throw new Error(writeOffError?.message ?? "Nao foi possivel registrar a baixa.");
  }

  const { error: parcelUpdateError } = await supabase
    .from("acordo_parcelas")
    .update({
      valor_pago: updatedPaidAmount,
      data_pagamento: nextParcelStatus === "pago" ? input.dataPagamento : parcel.data_pagamento,
      status: nextParcelStatus,
      operador_id: resolvedOperatorId,
      equipe_id: resolvedTeamId,
      percentual_honorarios:
        parcel.percentual_honorarios ?? feeCalculation.percentualHonorarios,
      valor_honorarios_previsto:
        parcel.valor_honorarios_previsto ?? feeCalculation.valorHonorarios,
      valor_escritorio_previsto:
        parcel.valor_escritorio_previsto ?? feeCalculation.valorEscritorio,
      tipo_receita: parcel.tipo_receita ?? revenue.tipoReceita,
      tipo_receita_origem: parcel.tipo_receita_origem ?? revenue.tipoReceitaOrigem,
      observacao:
        resolveNullableString(input.observacao) ??
        resolveNullableString(parcel.observacao) ??
        null,
    })
    .eq("id", parcel.id);

  if (parcelUpdateError) {
    throw new Error(parcelUpdateError.message);
  }

  const paymentContractLabel = agreement.contrato
    ? `${agreement.contrato} :: parcela ${parcel.numero_parcela}`
    : `Parcela ${parcel.numero_parcela}`;

  const { data: paymentRecord, error: paymentError } = await supabase
    .from("pagamentos")
    .upsert(
      {
        baixa_id: createdWriteOff.id,
        acordo_id: agreement.id,
        cliente_id: agreement.cliente_id,
        data_pagamento: input.dataPagamento,
        operador_id: resolvedOperatorId,
        equipe_id: resolvedTeamId,
        carteira_id: agreement.carteira_id,
        cpf_cnpj: agreement.cpf_cnpj,
        contrato: paymentContractLabel,
        valor_pago: roundCurrency(input.valorPago),
        valor_honorario: feeCalculation.valorHonorarios,
        percentual_honorarios: feeCalculation.percentualHonorarios,
        valor_escritorio: feeCalculation.valorEscritorio,
        tipo_receita: revenue.tipoReceita,
        tipo_receita_origem: revenue.tipoReceitaOrigem,
        registrado_por: profile.id,
        origem_arquivo: "baixa_manual",
      },
      { onConflict: "baixa_id" },
    )
    .select("*")
    .single();

  if (paymentError || !paymentRecord) {
    throw new Error(paymentError?.message ?? "Nao foi possivel gerar o pagamento da baixa.");
  }

  if (agreement.contrato_id) {
    const { data: linkedContract } = await supabase
      .from("contratos")
      .select("valor_em_aberto")
      .eq("id", agreement.contrato_id)
      .maybeSingle();

    await supabase
      .from("contratos")
      .update({
        valor_em_aberto: Math.max(
          roundCurrency((linkedContract?.valor_em_aberto ?? agreement.valor_original ?? 0) - input.valorPago),
          0,
        ),
        status: "em_acordo",
      })
      .eq("id", agreement.contrato_id);
  }

  await supabase.rpc("refresh_acordo_status", {
    target_acordo_id: agreement.id,
  });

  await registrarAuditoria({
    entidade: "baixa",
    entidadeId: createdWriteOff.id,
    acao: "baixa_registrada",
    descricao:
      resolveNullableString(input.observacao) ??
      `Baixa registrada para a parcela ${parcel.numero_parcela}.`,
    acordoId: agreement.id,
    parcelaId: parcel.id,
    baixaId: createdWriteOff.id,
    pagamentoId: paymentRecord.id,
    clienteId: agreement.cliente_id,
    contratoId: agreement.contrato_id,
    operadorId: resolvedOperatorId,
    equipeId: resolvedTeamId,
    carteiraId: agreement.carteira_id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "baixa",
    dadosAnteriores: {
      valorPago: parcel.valor_pago,
      status: parcel.status,
    },
    dadosNovos: {
      valorPago: updatedPaidAmount,
      status: nextParcelStatus,
      valorHonorarios: feeCalculation.valorHonorarios,
      tipoReceita: revenue.tipoReceita,
    },
  });

  return {
    agreementId: input.acordoId,
    writeOffId: createdWriteOff.id,
    status: await readAgreementStatus(input.acordoId),
    message: "Baixa registrada com sucesso.",
    demoMode: false,
  };
}

export async function alterarClassificacaoParcela(
  rawInput: UpdateInstallmentRevenueTypeInput,
) {
  const profile = await requireActiveProfile([
    "admin",
    "gerente",
    "supervisor",
    "financeiro",
  ]);
  const input = parseUpdateInstallmentRevenueTypeInput(rawInput);
  const context = await getClientsContext();
  const parcel = context.installments.find((item) => item.id === input.parcelaId);

  if (!parcel) {
    throw new Error("Parcela nao encontrada.");
  }

  const agreement = context.agreements.find((item) => item.id === parcel.acordo_id) ?? null;
  const previousRevenue = calcularClassificacaoAutomaticaParcela({
    numeroParcela: parcel.numero_parcela,
    tipo: parcel.tipo,
    manualType: parcel.tipo_receita ?? null,
  });

  if (!isSupabaseConfigured()) {
    return {
      parcelId: parcel.id,
      message: "Modo demonstracao: classificacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      parcelId: parcel.id,
      message: "Modo demonstracao: classificacao validada sem persistencia.",
      demoMode: true,
    };
  }

  const { error: parcelUpdateError } = await supabase
    .from("acordo_parcelas")
    .update({
      tipo_receita: input.tipoReceita,
      tipo_receita_origem: "manual",
    })
    .eq("id", parcel.id);

  if (parcelUpdateError) {
    throw new Error(parcelUpdateError.message);
  }

  const { data: linkedWriteOffs, error: linkedWriteOffsError } = await supabase
    .from("acordo_baixas")
    .select("id")
    .eq("parcela_id", parcel.id)
    .eq("estornada", false);

  if (linkedWriteOffsError) {
    throw new Error(linkedWriteOffsError.message);
  }

  const linkedWriteOffIds = (linkedWriteOffs ?? []).map((item) => item.id);

  if (linkedWriteOffIds.length) {
    const { error: writeOffUpdateError } = await supabase
      .from("acordo_baixas")
      .update({
        tipo_receita: input.tipoReceita,
        tipo_receita_origem: "manual",
      })
      .in("id", linkedWriteOffIds);

    if (writeOffUpdateError) {
      throw new Error(writeOffUpdateError.message);
    }

    const { error: paymentUpdateError } = await supabase
      .from("pagamentos")
      .update({
        tipo_receita: input.tipoReceita,
        tipo_receita_origem: "manual",
      })
      .in("baixa_id", linkedWriteOffIds);

    if (paymentUpdateError) {
      throw new Error(paymentUpdateError.message);
    }
  }

  await registrarAuditoria({
    entidade: "parcela",
    entidadeId: parcel.id,
    acao: "parcela_classificacao_alterada",
    descricao:
      linkedWriteOffIds.length > 0
        ? "Classificacao manual da parcela alterada com sincronizacao das baixas vinculadas."
        : "Classificacao manual da parcela alterada.",
    acordoId: agreement?.id ?? parcel.acordo_id,
    parcelaId: parcel.id,
    clienteId: agreement?.cliente_id ?? null,
    contratoId: agreement?.contrato_id ?? null,
    operadorId: parcel.operador_id ?? agreement?.operador_id ?? null,
    equipeId: parcel.equipe_id ?? agreement?.equipe_id ?? null,
    carteiraId: agreement?.carteira_id ?? null,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      tipoReceita: previousRevenue.tipoReceita,
      tipoReceitaOrigem:
        parcel.tipo_receita_origem ?? previousRevenue.tipoReceitaOrigem,
    },
    dadosNovos: {
      tipoReceita: input.tipoReceita,
      tipoReceitaOrigem: "manual",
      baixasSincronizadas: linkedWriteOffIds.length,
    },
  });

  return {
    parcelId: parcel.id,
    message:
      linkedWriteOffIds.length > 0
        ? "Classificacao atualizada e baixas vinculadas sincronizadas."
        : "Classificacao atualizada com sucesso.",
    demoMode: false,
  };
}

export async function cancelarAcordo(rawInput: unknown): Promise<AgreementOperationResult> {
  const profile = await requireActiveProfile();

  if (!canCancelAgreements(profile.perfil)) {
    throw new Error("Seu perfil nao pode cancelar acordos.");
  }

  const input = parseCancelAgreementInput(rawInput);
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

export const recalcularStatusAcordo = atualizarStatusAcordo;
export const gerarParcelas = gerarParcelasAcordo;
export const criarAcordoParcelado = criarAcordo;

export async function alterarOperadorParcela(params: {
  parcelaId: string;
  operadorId?: string | null;
  equipeId?: string | null;
}) {
  const profile = await requireActiveProfile(["admin", "gerente", "supervisor"]);
  const context = await getClientsContext();
  const parcel = context.installments.find((item) => item.id === params.parcelaId);

  if (!parcel) {
    throw new Error("Parcela nao encontrada.");
  }

  const agreement = context.agreements.find((item) => item.id === parcel.acordo_id);
  const scope = resolveAgreementScope(context, {
    requestedOperatorId: params.operadorId ?? null,
    requestedTeamId: params.equipeId ?? null,
    fallbackOperatorId: agreement?.operador_id ?? null,
    fallbackTeamId: agreement?.equipe_id ?? null,
  });

  if (!isSupabaseConfigured()) {
    return {
      parcelId: parcel.id,
      message: "Modo demonstracao: operador da parcela validado sem persistencia.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      parcelId: parcel.id,
      message: "Modo demonstracao: operador da parcela validado sem persistencia.",
      demoMode: true,
    };
  }

  const { error } = await supabase
    .from("acordo_parcelas")
    .update({
      operador_id: scope.operadorId,
      equipe_id: scope.equipeId,
    })
    .eq("id", parcel.id);

  if (error) {
    throw new Error(error.message);
  }

  await registrarAuditoria({
    entidade: "parcela",
    entidadeId: parcel.id,
    acao: "parcela_operador_alterado",
    descricao: "Operador responsavel da parcela alterado manualmente.",
    acordoId: agreement?.id ?? parcel.acordo_id,
    parcelaId: parcel.id,
    clienteId: agreement?.cliente_id ?? null,
    contratoId: agreement?.contrato_id ?? null,
    operadorId: scope.operadorId,
    equipeId: scope.equipeId,
    carteiraId: agreement?.carteira_id ?? null,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosAnteriores: {
      operadorId: parcel.operador_id ?? null,
      equipeId: parcel.equipe_id ?? null,
    },
    dadosNovos: {
      operadorId: scope.operadorId,
      equipeId: scope.equipeId,
    },
  });

  return {
    parcelId: parcel.id,
    message: "Operador da parcela atualizado com sucesso.",
    demoMode: false,
  };
}

export function parseCreateAgreementInput(payload: unknown) {
  return createAgreementSchema.parse(normalizeCreateAgreementPayload(payload));
}

export function parseWriteOffInput(payload: unknown) {
  return registerWriteOffSchema.parse(normalizeWriteOffPayload(payload));
}

export function parseCancelAgreementInput(payload: unknown) {
  return cancelAgreementSchema.parse(normalizeCancelAgreementPayload(payload));
}

export function parseUpdateInstallmentRevenueTypeInput(payload: unknown) {
  return updateInstallmentRevenueTypeSchema.parse(normalizeRevenueTypePayload(payload));
}

export { calcularClassificacaoAutomaticaParcela };
