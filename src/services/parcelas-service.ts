import "server-only";

import { differenceInCalendarDays, parseISO } from "date-fns";

import { requireActiveProfile } from "@/lib/auth";
import {
  deriveInstallmentStatus,
  matchesClientSearch,
  normalizeText,
  roundCurrency,
} from "@/lib/clientes-utils";
import {
  canEditInstallmentRevenueType,
  canRegisterAgreementPayments,
} from "@/lib/permissions";
import { buildAgreementCenterRows } from "@/services/acordos-service";
import { calcularClassificacaoAutomaticaParcela } from "@/services/honorarios-service";
import {
  getClientsContext,
  uniqueOptions,
  type ClientsContext,
} from "@/services/clientes-service";
import type {
  InstallmentCenterFilterOptions,
  InstallmentCenterFilters,
  InstallmentCenterPageData,
  InstallmentCenterRow,
  InstallmentCenterSummary,
} from "@/types/portal";

function buildInstallmentFilterOptions(
  context: ClientsContext,
): InstallmentCenterFilterOptions {
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
      { value: "pendente", label: "Pendente" },
      { value: "atrasado", label: "Atrasado" },
      { value: "pago", label: "Pago" },
      { value: "cancelado", label: "Cancelado" },
    ],
    revenueTypes: [
      { value: "NOVO", label: "Novo" },
      { value: "COLCHAO", label: "Colchao" },
    ],
  };
}

function buildInstallmentRows(context: ClientsContext): InstallmentCenterRow[] {
  const agreements = buildAgreementCenterRows(context);
  const today = new Date();

  return agreements.flatMap((agreement) =>
    agreement.parcelasDetalhe.map((installment) => {
      const status = deriveInstallmentStatus(installment);
      const revenueType = installment.tipo_receita
        ? installment.tipo_receita
        : calcularClassificacaoAutomaticaParcela({
            numeroParcela: installment.numero_parcela,
            tipo: installment.tipo,
            manualType: installment.tipo_receita ?? null,
          }).tipoReceita;
      const revenueTypeOrigin = installment.tipo_receita_origem
        ? installment.tipo_receita_origem
        : installment.tipo_receita
          ? "manual"
          : calcularClassificacaoAutomaticaParcela({
              numeroParcela: installment.numero_parcela,
              tipo: installment.tipo,
              manualType: installment.tipo_receita ?? null,
            }).tipoReceitaOrigem;
      const diasEmAtraso =
        status === "atrasado"
          ? Math.max(
              differenceInCalendarDays(today, parseISO(installment.data_vencimento)),
              0,
            )
          : 0;

      return {
        id: installment.id,
        agreementId: agreement.id,
        clientId: agreement.clientId,
        walletId: agreement.walletId,
        operatorId: agreement.operatorId,
        teamId: agreement.teamId,
        cliente: agreement.cliente,
        cpfCnpj: agreement.cpfCnpj,
        contrato: agreement.contrato,
        carteira: agreement.carteira,
        credor: agreement.credor,
        operador: agreement.operador,
        equipe: agreement.equipe,
        numeroParcela: installment.numero_parcela,
        tipo: installment.tipo,
        vencimento: installment.data_vencimento,
        valorParcela: installment.valor_parcela,
        valorPago: installment.valor_pago,
        saldo: roundCurrency(
          Math.max(installment.valor_parcela - installment.valor_pago, 0),
        ),
        status,
        diasEmAtraso,
        dataPagamento: installment.data_pagamento,
        acordoStatus: agreement.status,
        observacao: installment.observacao,
        percentualHonorarios: installment.percentual_honorarios ?? null,
        valorHonorariosPrevisto: installment.valor_honorarios_previsto ?? null,
        valorEscritorioPrevisto: installment.valor_escritorio_previsto ?? null,
        tipoReceita: revenueType,
        tipoReceitaOrigem: revenueTypeOrigin,
      } satisfies InstallmentCenterRow;
    }),
  );
}

function filterInstallmentRows(
  rows: InstallmentCenterRow[],
  filters: InstallmentCenterFilters,
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
        (!filters.walletId || row.walletId === filters.walletId) &&
        (!filters.creditor ||
          normalizeText(row.credor) === normalizeText(filters.creditor)) &&
        (!filters.teamId || row.teamId === filters.teamId) &&
        (!filters.operatorId || row.operatorId === filters.operatorId) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.revenueType || row.tipoReceita === filters.revenueType) &&
        (!filters.startDate || row.vencimento >= filters.startDate) &&
        (!filters.endDate || row.vencimento <= filters.endDate)
      );
    })
    .sort((left, right) => left.vencimento.localeCompare(right.vencimento));
}

function buildInstallmentSummary(rows: InstallmentCenterRow[]): InstallmentCenterSummary {
  const pendentes = rows.filter((row) => row.status === "pendente").length;
  const vencidas = rows.filter((row) => row.status === "atrasado").length;
  const pagas = rows.filter((row) => row.status === "pago").length;

  return {
    pendentes,
    vencidas,
    pagas,
    valorVencido: roundCurrency(
      rows
        .filter((row) => row.status === "atrasado")
        .reduce((total, row) => total + row.saldo, 0),
    ),
    valorAVencer: roundCurrency(
      rows
        .filter((row) => row.status === "pendente")
        .reduce((total, row) => total + row.saldo, 0),
    ),
    recebido: roundCurrency(rows.reduce((total, row) => total + row.valorPago, 0)),
    novo: rows.filter((row) => row.tipoReceita === "NOVO").length,
    colchao: rows.filter((row) => row.tipoReceita === "COLCHAO").length,
  };
}

export async function listarParcelas(filters: InstallmentCenterFilters = {}) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);
  const context = await getClientsContext();
  return filterInstallmentRows(buildInstallmentRows(context), filters);
}

export async function getParcelasPageData(
  filters: InstallmentCenterFilters = {},
): Promise<InstallmentCenterPageData> {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);
  const context = await getClientsContext();
  const agreements = buildAgreementCenterRows(context);
  const installments = filterInstallmentRows(buildInstallmentRows(context), filters);

  return {
    profile: context.profile,
    filters,
    options: buildInstallmentFilterOptions(context),
    summary: buildInstallmentSummary(installments),
    installments,
    agreements,
    canRegisterWriteOff: canRegisterAgreementPayments(context.profile.perfil),
    canEditInstallmentRevenueType: canEditInstallmentRevenueType(
      context.profile.perfil,
    ),
    demoMode: context.demoMode,
  };
}
