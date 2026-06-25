import "server-only";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import {
  getPrimaryWalletLabel,
  matchesClientSearch,
  normalizeText,
  roundCurrency,
} from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import {
  canReverseAgreementPayments,
  canViewWriteOffCentral,
} from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientsContext, uniqueOptions, buildResolvedCollections, type ClientsContext } from "@/services/clientes-service";
import { criarContratoDuranteBaixa } from "@/services/contratos-service";
import { darBaixaParcela, parseWriteOffInput } from "@/services/acordos-service";
import type {
  AgreementOperationResult,
  WriteOffCenterFilterOptions,
  WriteOffCenterFilters,
  WriteOffCenterPageData,
  WriteOffCenterRow,
  WriteOffCenterSummary,
} from "@/types/portal";

const reverseWriteOffSchema = z.object({
  baixaId: z.string().uuid("Baixa invalida."),
  motivoEstorno: z.string().trim().nullable().optional(),
});

function resolveNullableString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function readAgreementStatus(agreementId: string) {
  const supabase = isSupabaseConfigured()
    ? await createSupabaseServerClient()
    : null;

  if (!supabase) {
    return "ativo";
  }

  const { data, error } = await supabase
    .from("acordos")
    .select("status")
    .eq("id", agreementId)
    .single();

  if (error || !data?.status) {
    return "ativo";
  }

  return data.status;
}

function buildWriteOffFilterOptions(
  context: ClientsContext,
): WriteOffCenterFilterOptions {
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
    paymentMethods: uniqueOptions(
      context.writeOffs
        .map((writeOff) => writeOff.forma_pagamento)
        .filter((value): value is string => Boolean(value))
        .map((value) => ({
          value,
          label: value,
        })),
    ),
    registeredBy: uniqueOptions(
      context.profiles.map((profile) => ({
        value: profile.id,
        label: profile.nome,
      })),
    ),
    revenueTypes: [
      { value: "NOVO", label: "Novo" },
      { value: "COLCHAO", label: "Colchao" },
    ],
    reversedStatuses: [
      { value: "ativas", label: "Ativas" },
      { value: "estornadas", label: "Estornadas" },
      { value: "todas", label: "Todas" },
    ],
  };
}

function buildWriteOffRows(context: ClientsContext): WriteOffCenterRow[] {
  const resolved = buildResolvedCollections(context);

  return resolved.resolvedWriteOffs
    .flatMap((writeOff) => {
      const agreement = resolved.agreementById.get(writeOff.acordo_id);

      if (!agreement) {
        return [];
      }

      const client = agreement.cliente_id
        ? resolved.clientById.get(agreement.cliente_id)
        : undefined;
      const wallet = agreement.carteira_id
        ? resolved.walletById.get(agreement.carteira_id)
        : undefined;
      const installment = agreement.resolvedInstallments.find(
        (item) => item.id === writeOff.parcela_id,
      );
      const registeredBy = writeOff.registrado_por
        ? resolved.profileById.get(writeOff.registrado_por)?.nome ?? "Portal BKO"
        : "Portal BKO";
      const reversedBy = writeOff.estornada_por
        ? resolved.profileById.get(writeOff.estornada_por)?.nome ?? "Portal BKO"
        : null;

      const row: WriteOffCenterRow = {
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
      };

      return [row];
    })
    .sort((left, right) => right.dataPagamento.localeCompare(left.dataPagamento));
}

function filterWriteOffRows(
  rows: WriteOffCenterRow[],
  filters: WriteOffCenterFilters,
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
        (!filters.paymentMethod ||
          normalizeText(row.formaPagamento) === normalizeText(filters.paymentMethod)) &&
        (!filters.registeredBy || row.registradoPorId === filters.registeredBy) &&
        (!filters.revenueType || row.tipoReceita === filters.revenueType) &&
        (!filters.reversedStatus ||
          filters.reversedStatus === "todas" ||
          (filters.reversedStatus === "ativas" && !row.estornada) ||
          (filters.reversedStatus === "estornadas" && row.estornada)) &&
        (!filters.startDate || row.dataPagamento >= filters.startDate) &&
        (!filters.endDate || row.dataPagamento <= filters.endDate)
      );
    })
    .sort((left, right) => right.dataPagamento.localeCompare(left.dataPagamento));
}

function resolveTopLabel(rows: WriteOffCenterRow[], key: "carteira" | "operador") {
  const totals = new Map<string, number>();

  for (const row of rows.filter((item) => !item.estornada)) {
    const current = totals.get(row[key]) ?? 0;
    totals.set(row[key], current + row.valorPago);
  }

  const [topEntry] = [...totals.entries()].sort((left, right) => right[1] - left[1]);
  return topEntry?.[0] ?? "-";
}

function buildWriteOffSummary(rows: WriteOffCenterRow[]): WriteOffCenterSummary {
  const activeRows = rows.filter((row) => !row.estornada);
  const recebidoNoPeriodo = roundCurrency(
    activeRows.reduce((total, row) => total + row.valorPago, 0),
  );
  const quantidadeBaixas = activeRows.length;

  return {
    recebidoNoPeriodo,
    quantidadeBaixas,
    ticketMedio:
      quantidadeBaixas > 0 ? roundCurrency(recebidoNoPeriodo / quantidadeBaixas) : 0,
    baixasEstornadas: rows.filter((row) => row.estornada).length,
    maiorCarteira: resolveTopLabel(rows, "carteira"),
    maiorOperador: resolveTopLabel(rows, "operador"),
    honorariosEscritorio: roundCurrency(
      activeRows.reduce((total, row) => total + (row.valorEscritorio ?? 0), 0),
    ),
    valorRepassado: roundCurrency(
      activeRows.reduce(
        (total, row) => total + Math.max(row.valorPago - (row.valorEscritorio ?? 0), 0),
        0,
      ),
    ),
  };
}

export async function listarBaixas(filters: WriteOffCenterFilters = {}) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "financeiro"]);
  const context = await getClientsContext();

  if (!canViewWriteOffCentral(context.profile.perfil)) {
    return [] satisfies WriteOffCenterRow[];
  }

  return filterWriteOffRows(buildWriteOffRows(context), filters);
}

export async function estornarBaixa(
  rawInput: unknown,
): Promise<AgreementOperationResult> {
  const profile = await requireActiveProfile(["admin", "gerente", "supervisor", "financeiro"]);

  if (!canReverseAgreementPayments(profile.perfil)) {
    throw new Error("Seu perfil nao pode estornar baixas.");
  }

  const input = reverseWriteOffSchema.parse(rawInput);

  if (!isSupabaseConfigured()) {
    return {
      writeOffId: input.baixaId,
      status: "ativo",
      message: "Modo demonstracao: estorno validado sem persistencia no banco.",
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      writeOffId: input.baixaId,
      status: "ativo",
      message: "Modo demonstracao: estorno validado sem persistencia no banco.",
      demoMode: true,
    };
  }

  const { data: writeOff, error: writeOffError } = await supabase
    .from("acordo_baixas")
    .select("acordo_id")
    .eq("id", input.baixaId)
    .single();

  if (writeOffError || !writeOff?.acordo_id) {
    throw new Error(writeOffError?.message ?? "Baixa nao encontrada.");
  }

  const { data, error } = await supabase.rpc("portal_estornar_baixa", {
    p_baixa_id: input.baixaId,
    p_motivo_estorno: resolveNullableString(input.motivoEstorno),
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel estornar a baixa.");
  }

  return {
    agreementId: writeOff.acordo_id,
    writeOffId: data,
    status: await readAgreementStatus(writeOff.acordo_id),
    message: "Baixa estornada com sucesso.",
    demoMode: false,
  };
}

export function parseReverseWriteOffInput(payload: unknown) {
  return reverseWriteOffSchema.parse(payload);
}

export async function getBaixasPageData(
  filters: WriteOffCenterFilters = {},
): Promise<WriteOffCenterPageData> {
  await requireActiveProfile(["admin", "gerente", "supervisor", "financeiro"]);
  const context = await getClientsContext();
  const writeOffs = filterWriteOffRows(buildWriteOffRows(context), filters);

  return {
    profile: context.profile,
    filters,
    options: buildWriteOffFilterOptions(context),
    summary: buildWriteOffSummary(writeOffs),
    writeOffs,
    canReverseWriteOff: canReverseAgreementPayments(context.profile.perfil),
    demoMode: context.demoMode,
  };
}

export { darBaixaParcela, parseWriteOffInput };
export { criarContratoDuranteBaixa };
