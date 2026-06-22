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
import { listarHistoricoAcordo } from "@/services/auditoria-service";
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
  WriteOffCenterRow,
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

export const recalcularStatusAcordo = atualizarStatusAcordo;

export function parseCreateAgreementInput(payload: unknown) {
  return createAgreementSchema.parse(payload);
}

export function parseWriteOffInput(payload: unknown) {
  return registerWriteOffSchema.parse(payload);
}

export function parseCancelAgreementInput(payload: unknown) {
  return cancelAgreementSchema.parse(payload);
}
