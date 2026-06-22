import "server-only";

import { cache } from "react";
import { addDays, parseISO, subDays } from "date-fns";

import { requireActiveProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getMockPortalDataset } from "@/lib/mock-data";
import {
  canCancelAgreements,
  canCreateAgreements,
  canRegisterAgreementPayments,
  canViewClients,
} from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deriveAgreementStatus,
  deriveInstallmentStatus,
  getPrimaryWalletLabel,
  matchesClientSearch,
  normalizeDocument,
  normalizeText,
  roundCurrency,
} from "@/lib/clientes-utils";
import type { Database } from "@/types/database";
import type {
  Agreement,
  AgreementInstallment,
  AgreementWriteOff,
  Client,
  ClientActionRow,
  ClientContractRow,
  ClientDetailPageData,
  ClientFilterOptions,
  ClientListFilters,
  ClientListPageData,
  ClientListRow,
  ClientPaymentRow,
  ClientStatus,
  ClientSummaryCards,
  ClientWalletLink,
  ContactAction,
  Contract,
  FilterOption,
  Operator,
  Payment,
  PortalProfile,
  Team,
  Wallet,
} from "@/types/portal";

type ClientRow = Database["public"]["Tables"]["clientes"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface ClientsContext {
  profile: PortalProfile;
  demoMode: boolean;
  clients: Client[];
  walletLinks: ClientWalletLink[];
  contracts: Contract[];
  agreements: Agreement[];
  installments: AgreementInstallment[];
  writeOffs: AgreementWriteOff[];
  payments: Payment[];
  actions: ContactAction[];
  operators: Operator[];
  teams: Team[];
  wallets: Wallet[];
  profiles: PortalProfile[];
}

interface ResolvedAction {
  row: ContactAction;
  clientId: string | null;
}

function toRows<T>(data: { data: T[] | null }) {
  return data.data ?? [];
}

export function uniqueOptions(options: FilterOption[]) {
  return Array.from(
    new Map(options.map((option) => [option.value, option])).values(),
  );
}

function mapProfileRows(rows: ProfileRow[]) {
  return rows.map((row) => ({
    ...row,
    perfil: row.perfil as PortalProfile["perfil"],
  }));
}

function mapClientRows(rows: ClientRow[]) {
  return rows.map((row) => ({
    ...row,
    status: row.status as ClientStatus,
  }));
}

function groupBy<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);

    if (!key) {
      continue;
    }

    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }

  return groups;
}

function pickLatestDate(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function resolveClientStatus(
  client: Client,
  contracts: Contract[],
  agreements: Array<Agreement & { resolvedStatus: string; remainingValue: number }>,
) {
  if (client.status === "inativo") {
    return "inativo" satisfies ClientStatus;
  }

  if (
    agreements.some((agreement) =>
      ["ativo", "aguardando_pagamento", "parcial", "atrasado", "quebrado"].includes(
        agreement.resolvedStatus,
      ),
    )
  ) {
    return "com_acordo" satisfies ClientStatus;
  }

  if (contracts.length && contracts.every((item) => roundCurrency(item.valor_em_aberto) <= 0)) {
    return "quitado" satisfies ClientStatus;
  }

  return "em_cobranca" satisfies ClientStatus;
}

function createMockClientsContext(profile: PortalProfile): ClientsContext {
  const base = getMockPortalDataset();
  const operators = base.operators.slice(0, 6);
  const teams = base.teams;
  const wallets = base.wallets.slice(0, 4);
  const today = new Date();

  const clients: Client[] = Array.from({ length: 8 }, (_, index) => {
    const operator = operators[index % operators.length];
    const team = teams.find((item) => item.id === operator.equipe_id) ?? teams[0];
    const cpf = `${index + 1}`.padStart(11, "0");
    const city = ["Sao Paulo", "Campinas", "Belo Horizonte", "Curitiba"][index % 4];
    const uf = ["SP", "SP", "MG", "PR"][index % 4];

    return {
      id: `client-${index + 1}`,
      nome: [
        "Marina Oliveira",
        "Grupo Solaris Ltda",
        "Rafael Gomes",
        "Industria Boreal SA",
        "Camila Nunes",
        "Hospital Vitta",
        "Bruno Teixeira",
        "Comercial Navega",
      ][index] ?? `Cliente ${index + 1}`,
      cpf_cnpj: cpf,
      email: index % 3 === 0 ? `cliente${index + 1}@portalbko.demo` : null,
      telefone: `1199${String(index + 1).padStart(7, "0")}`,
      endereco: `Rua ${index + 10}, ${100 + index}`,
      cidade: city,
      uf,
      cep: `0100${index}000`,
      status: index % 4 === 0 ? "com_acordo" : "em_cobranca",
      operador_id: operator.id,
      equipe_id: team.id,
      chave_externa: null,
      criado_em: subDays(today, 180 - index).toISOString(),
      atualizado_em: subDays(today, 10 - (index % 5)).toISOString(),
    };
  });

  const walletLinks: ClientWalletLink[] = clients.map((client, index) => {
    const wallet = wallets[index % wallets.length];

    return {
      id: `client-wallet-${client.id}`,
      cliente_id: client.id,
      carteira_id: wallet.id,
      credor: wallet.credor,
      ativo: true,
      chave_externa: null,
      criado_em: client.criado_em,
      atualizado_em: client.atualizado_em,
    };
  });

  const contracts: Contract[] = clients.flatMap((client, index) => {
    const wallet = wallets[index % wallets.length];
    const operator = operators[index % operators.length];
    const teamId = operator.equipe_id;
    const baseValue = 4800 + index * 1250;
    const agreementOpen = index % 2 === 0;

    return [
      {
        id: `contract-${client.id}-1`,
        cliente_id: client.id,
        carteira_id: wallet.id,
        credor: wallet.credor,
        numero_contrato: `CTR-${1000 + index}`,
        valor_original: baseValue,
        valor_em_aberto: agreementOpen ? roundCurrency(baseValue * 0.62) : 0,
        data_contrato: subDays(today, 360 - index).toISOString().slice(0, 10),
        data_vencimento: addDays(today, 15 + index).toISOString().slice(0, 10),
        status: agreementOpen ? "em_acordo" : "quitado",
        operador_id: operator.id,
        equipe_id: teamId,
        chave_externa: null,
        criado_em: client.criado_em,
        atualizado_em: client.atualizado_em,
      },
    ];
  });

  const agreements: Agreement[] = clients.flatMap((client, index) => {
    if (index % 3 === 2) {
      return [];
    }

    const contract = contracts.find((item) => item.cliente_id === client.id);
    if (!contract) {
      return [];
    }

    const value = roundCurrency(contract.valor_original * 0.7);
    const entry = index % 2 === 0 ? roundCurrency(value * 0.15) : 0;
    const quantity = index % 2 === 0 ? 4 : 1;
    const agreementDate = subDays(today, 28 - index).toISOString().slice(0, 10);

    return [
      {
        id: `agreement-${client.id}`,
        cliente_id: client.id,
        contrato_id: contract.id,
        data_acordo: agreementDate,
        operador_id: client.operador_id,
        equipe_id: client.equipe_id,
        carteira_id: contract.carteira_id,
        cpf_cnpj: client.cpf_cnpj,
        contrato: contract.numero_contrato,
        valor_original: contract.valor_original,
        valor_acordo: value,
        valor_entrada: entry,
        quantidade_parcelas: quantity,
        valor_parcela: roundCurrency((value - entry) / quantity),
        valor_pago: index % 2 === 0 ? entry : 0,
        data_vencimento_entrada:
          entry > 0 ? addDays(parseISO(agreementDate), 5).toISOString().slice(0, 10) : null,
        primeiro_vencimento: addDays(parseISO(agreementDate), 30).toISOString().slice(0, 10),
        forma_pagamento: index % 2 === 0 ? "Boleto" : "PIX",
        status: index % 4 === 0 ? "parcial" : "ativo",
        observacao: index % 2 === 0 ? "Negociacao consolidada com entrada." : null,
        criado_por: profile.id,
        chave_externa: null,
        importacao_id: null,
        ultimo_pagamento_em:
          entry > 0 ? addDays(parseISO(agreementDate), 4).toISOString().slice(0, 10) : null,
        criado_em: parseISO(agreementDate).toISOString(),
        atualizado_em: parseISO(agreementDate).toISOString(),
      },
    ];
  });

  const installments: AgreementInstallment[] = agreements.flatMap((agreement) => {
    const created: AgreementInstallment[] = [];

    if (agreement.valor_entrada > 0 && agreement.data_vencimento_entrada) {
      created.push({
        id: `parcel-${agreement.id}-1`,
        acordo_id: agreement.id,
        numero_parcela: 1,
        tipo: "entrada",
        data_vencimento: agreement.data_vencimento_entrada,
        valor_parcela: agreement.valor_entrada,
        valor_pago: agreement.valor_entrada,
        data_pagamento: addDays(parseISO(agreement.data_vencimento_entrada), -1)
          .toISOString()
          .slice(0, 10),
        status: "pago",
        observacao: null,
        chave_externa: null,
        criado_em: agreement.criado_em,
        atualizado_em: agreement.atualizado_em,
      });
    }

    const start = agreement.primeiro_vencimento ? parseISO(agreement.primeiro_vencimento) : today;

    for (let index = 0; index < agreement.quantidade_parcelas; index += 1) {
      const dueDate = addDays(start, index * 30).toISOString().slice(0, 10);
      const paid = agreement.status === "parcial" && index === 0 ? agreement.valor_parcela : 0;
      const totalIndex = created.length + 1;

      created.push({
        id: `parcel-${agreement.id}-${totalIndex}`,
        acordo_id: agreement.id,
        numero_parcela: totalIndex,
        tipo:
          agreement.quantidade_parcelas === 1 && agreement.valor_entrada === 0
            ? "avista"
            : "parcela",
        data_vencimento: dueDate,
        valor_parcela: agreement.valor_parcela,
        valor_pago: paid,
        data_pagamento:
          paid > 0 ? addDays(parseISO(dueDate), -2).toISOString().slice(0, 10) : null,
        status:
          paid > 0
            ? "pago"
            : dueDate < today.toISOString().slice(0, 10)
              ? "atrasado"
              : "pendente",
        observacao: null,
        chave_externa: null,
        criado_em: agreement.criado_em,
        atualizado_em: agreement.atualizado_em,
      });
    }

    return created;
  });

  const writeOffs: AgreementWriteOff[] = installments
    .filter((item) => item.valor_pago > 0)
    .map((installment) => {
      const agreement = agreements.find((item) => item.id === installment.acordo_id);

      return {
        id: `writeoff-${installment.id}`,
        acordo_id: installment.acordo_id,
        parcela_id: installment.id,
        cliente_id: agreement?.cliente_id ?? null,
        data_pagamento: installment.data_pagamento ?? installment.data_vencimento,
        valor_pago: installment.valor_pago,
        forma_pagamento: "Boleto",
        observacao: null,
        registrado_por: profile.id,
        chave_externa: null,
        estornada: false,
        estornada_em: null,
        estornada_por: null,
        motivo_estorno: null,
        criado_em: addDays(parseISO(installment.data_vencimento), -1).toISOString(),
      };
    });

  const payments: Payment[] = writeOffs.map((item, index) => {
    const agreement = agreements.find((row) => row.id === item.acordo_id);
    const installment = installments.find((row) => row.id === item.parcela_id);

    return {
      id: `payment-${item.id}`,
      baixa_id: item.id,
      acordo_id: item.acordo_id,
      cliente_id: item.cliente_id,
      data_pagamento: item.data_pagamento,
      operador_id: agreement?.operador_id ?? null,
      equipe_id: agreement?.equipe_id ?? null,
      carteira_id: agreement?.carteira_id ?? null,
      cpf_cnpj: agreement?.cpf_cnpj ?? null,
      contrato: `${agreement?.contrato ?? "Sem contrato"} :: parcela ${installment?.numero_parcela ?? index + 1}`,
      valor_pago: item.valor_pago,
      valor_honorario: roundCurrency(item.valor_pago * 0.1),
      origem_arquivo: "baixa_manual",
      chave_externa: null,
      importacao_id: null,
      estornado: false,
      estornado_em: null,
      estornado_por: null,
      motivo_estorno: null,
      criado_em: addDays(parseISO(item.data_pagamento), 1).toISOString(),
    };
  });

  const actions: ContactAction[] = clients.map((client, index) => ({
    id: `action-${client.id}`,
    data_acionamento: subDays(today, index + 2).toISOString().slice(0, 10),
    operador_id: client.operador_id,
    equipe_id: client.equipe_id,
    carteira_id: walletLinks[index % walletLinks.length]?.carteira_id ?? null,
    cpf_cnpj: client.cpf_cnpj,
    contrato: contracts.find((item) => item.cliente_id === client.id)?.numero_contrato ?? null,
    evento: index % 2 === 0 ? "Ligacao" : "WhatsApp",
    descricao: "Contato registrado para acompanhamento do acordo.",
    canal: index % 2 === 0 ? "voz" : "mensageria",
    importacao_id: null,
    criado_em: subDays(today, index + 2).toISOString(),
  }));

  const context: ClientsContext = {
    profile,
    demoMode: true,
    clients,
    walletLinks,
    contracts,
    agreements,
    installments,
    writeOffs,
    payments,
    actions,
    operators,
    teams,
    wallets,
    profiles: [profile],
  };

  return scopeClientsContext(context, profile);
}

function scopeClientsContext(context: ClientsContext, profile: PortalProfile) {
  if (["admin", "gerente", "financeiro"].includes(profile.perfil)) {
    return context;
  }

  const allowedTeamIds =
    profile.perfil === "supervisor"
      ? new Set([profile.equipe_id].filter(Boolean) as string[])
      : new Set<string>();
  const allowedOperatorIds =
    profile.perfil === "operador"
      ? new Set([profile.operador_id].filter(Boolean) as string[])
      : new Set<string>();

  const clients = context.clients.filter((client) => {
    if (profile.perfil === "supervisor") {
      return Boolean(client.equipe_id && allowedTeamIds.has(client.equipe_id));
    }

    return Boolean(client.operador_id && allowedOperatorIds.has(client.operador_id));
  });

  const clientIds = new Set(clients.map((item) => item.id));
  const agreementIds = new Set(
    context.agreements
      .filter((item) => item.cliente_id && clientIds.has(item.cliente_id))
      .map((item) => item.id),
  );
  const installmentIds = new Set(
    context.installments
      .filter((item) => agreementIds.has(item.acordo_id))
      .map((item) => item.id),
  );

  return {
    ...context,
    clients,
    walletLinks: context.walletLinks.filter((item) => clientIds.has(item.cliente_id)),
    contracts: context.contracts.filter((item) => clientIds.has(item.cliente_id)),
    agreements: context.agreements.filter(
      (item) => item.cliente_id && clientIds.has(item.cliente_id),
    ),
    installments: context.installments.filter((item) =>
      agreementIds.has(item.acordo_id),
    ),
    writeOffs: context.writeOffs.filter(
      (item) =>
        agreementIds.has(item.acordo_id) || installmentIds.has(item.parcela_id),
    ),
    payments: context.payments.filter(
      (item) =>
        (item.cliente_id && clientIds.has(item.cliente_id)) ||
        (item.acordo_id && agreementIds.has(item.acordo_id)),
    ),
    actions: context.actions.filter(
      (item) =>
        normalizeDocument(item.cpf_cnpj).length > 0 &&
        clients.some(
          (client) => normalizeDocument(client.cpf_cnpj) === normalizeDocument(item.cpf_cnpj),
        ),
    ),
    operators: context.operators.filter((item) => {
      if (profile.perfil === "supervisor") {
        return Boolean(item.equipe_id && allowedTeamIds.has(item.equipe_id));
      }

      return Boolean(profile.operador_id === item.id);
    }),
    teams: context.teams.filter((item) => {
      if (profile.perfil === "supervisor") {
        return allowedTeamIds.has(item.id);
      }

      return Boolean(profile.equipe_id === item.id);
    }),
  };
}

export const getClientsContext = cache(async (): Promise<ClientsContext> => {
  const profile = await requireActiveProfile();

  if (!canViewClients(profile.perfil)) {
    return createMockClientsContext(profile);
  }

  if (!isSupabaseConfigured()) {
    return createMockClientsContext(profile);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createMockClientsContext(profile);
  }

  const [
    clientsResult,
    walletLinksResult,
    contractsResult,
    agreementsResult,
    installmentsResult,
    writeOffsResult,
    paymentsResult,
    actionsResult,
    operatorsResult,
    teamsResult,
    walletsResult,
    profilesResult,
  ] = await Promise.all([
    supabase.from("clientes").select("*").order("nome"),
    supabase
      .from("cliente_carteiras")
      .select("*")
      .order("atualizado_em", { ascending: false }),
    supabase.from("contratos").select("*").order("atualizado_em", { ascending: false }),
    supabase.from("acordos").select("*").order("data_acordo", { ascending: false }),
    supabase
      .from("acordo_parcelas")
      .select("*")
      .order("numero_parcela", { ascending: true }),
    supabase
      .from("acordo_baixas")
      .select("*")
      .order("data_pagamento", { ascending: false }),
    supabase
      .from("pagamentos")
      .select("*")
      .order("data_pagamento", { ascending: false }),
    supabase
      .from("acionamentos")
      .select("*")
      .order("data_acionamento", { ascending: false }),
    supabase.from("operadores").select("*").order("nome"),
    supabase.from("equipes").select("*").order("nome"),
    supabase.from("carteiras").select("*").order("nome"),
    supabase.from("profiles").select("*").order("nome"),
  ]);

  return {
    profile,
    demoMode: false,
    clients: mapClientRows(toRows(clientsResult)),
    walletLinks: toRows(walletLinksResult) as ClientWalletLink[],
    contracts: toRows(contractsResult) as Contract[],
    agreements: toRows(agreementsResult) as Agreement[],
    installments: toRows(installmentsResult) as AgreementInstallment[],
    writeOffs: toRows(writeOffsResult) as AgreementWriteOff[],
    payments: toRows(paymentsResult) as Payment[],
    actions: toRows(actionsResult) as ContactAction[],
    operators: toRows(operatorsResult) as Operator[],
    teams: toRows(teamsResult) as Team[],
    wallets: toRows(walletsResult) as Wallet[],
    profiles: mapProfileRows(toRows(profilesResult)),
  };
});

export function buildResolvedCollections(context: ClientsContext) {
  const walletById = new Map(context.wallets.map((item) => [item.id, item]));
  const operatorById = new Map(context.operators.map((item) => [item.id, item]));
  const teamById = new Map(context.teams.map((item) => [item.id, item]));
  const profileById = new Map(context.profiles.map((item) => [item.id, item]));
  const clientById = new Map(context.clients.map((item) => [item.id, item]));
  const clientByDocument = new Map(
    context.clients.map((item) => [normalizeDocument(item.cpf_cnpj), item]),
  );
  const contractsByClient = groupBy(context.contracts, (item) => item.cliente_id);
  const contractNumberToClientId = new Map(
    context.contracts.map((item) => [normalizeText(item.numero_contrato), item.cliente_id]),
  );
  const installmentsByAgreement = groupBy(context.installments, (item) => item.acordo_id);

  function resolveClientId(payload: {
    directClientId?: string | null;
    document?: string | null;
    contract?: string | null;
  }) {
    if (payload.directClientId && clientById.has(payload.directClientId)) {
      return payload.directClientId;
    }

    const byDocument = clientByDocument.get(normalizeDocument(payload.document));

    if (byDocument) {
      return byDocument.id;
    }

    const normalizedContract = normalizeText(payload.contract);

    if (normalizedContract && contractNumberToClientId.has(normalizedContract)) {
      return contractNumberToClientId.get(normalizedContract) ?? null;
    }

    return null;
  }

  const resolvedAgreements = context.agreements.map((agreement) => {
    const clientId = resolveClientId({
      directClientId: agreement.cliente_id,
      document: agreement.cpf_cnpj,
      contract: agreement.contrato,
    });
    const resolvedInstallments = installmentsByAgreement.get(agreement.id) ?? [];
    const resolvedStatus = deriveAgreementStatus(agreement, resolvedInstallments);
    const paidAmount = roundCurrency(
      resolvedInstallments.reduce((total, item) => total + item.valor_pago, 0),
    );
    const remainingValue = roundCurrency(
      Math.max(agreement.valor_acordo - paidAmount, 0),
    );

    return {
      ...agreement,
      cliente_id: clientId,
      status: resolvedStatus,
      valor_pago: paidAmount,
      resolvedStatus,
      remainingValue,
      resolvedInstallments,
    };
  });

  const agreementsByClient = groupBy(resolvedAgreements, (item) => item.cliente_id);
  const agreementById = new Map(resolvedAgreements.map((item) => [item.id, item]));
  const walletLinksByClient = groupBy(context.walletLinks, (item) => item.cliente_id);
  const resolvedWriteOffs = context.writeOffs.map((item) => {
    const agreement = agreementById.get(item.acordo_id);

    return {
      ...item,
      cliente_id:
        item.cliente_id ??
        agreement?.cliente_id ??
        resolveClientId({
          document: agreement?.cpf_cnpj ?? null,
          contract: agreement?.contrato ?? null,
        }),
    };
  });
  const writeOffsByClient = groupBy(resolvedWriteOffs, (item) => item.cliente_id);
  const resolvedPayments = context.payments.map((item) => {
    const agreement = item.acordo_id ? agreementById.get(item.acordo_id) : null;

    return {
      ...item,
      cliente_id:
        item.cliente_id ??
        agreement?.cliente_id ??
        resolveClientId({
          document: item.cpf_cnpj ?? agreement?.cpf_cnpj ?? null,
          contract: item.contrato ?? agreement?.contrato ?? null,
        }),
    };
  });
  const paymentsByClient = groupBy(resolvedPayments, (item) => item.cliente_id);

  const resolvedActions: ResolvedAction[] = context.actions.map((row) => ({
    row,
    clientId: resolveClientId({
      document: row.cpf_cnpj,
      contract: row.contrato,
    }),
  }));
  const actionsByClient = groupBy(resolvedActions, (item) => item.clientId);

  return {
    walletById,
    operatorById,
    teamById,
    profileById,
    clientById,
    contractsByClient,
    walletLinksByClient,
    installmentsByAgreement,
    agreementsByClient,
    writeOffsByClient,
    paymentsByClient,
    actionsByClient,
    agreementById,
    resolvedAgreements,
    resolvedPayments,
    resolvedWriteOffs,
    resolvedActions,
  };
}

function buildClientFilterOptions(context: ClientsContext): ClientFilterOptions {
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
      { value: "em_cobranca", label: "Em cobranca" },
      { value: "com_acordo", label: "Com acordo" },
      { value: "quitado", label: "Quitado" },
      { value: "inativo", label: "Inativo" },
    ],
  };
}

function buildClientSummaryCards(
  contracts: Contract[],
  agreements: Array<Agreement & { resolvedStatus: string; remainingValue: number }>,
  payments: Payment[],
) {
  return {
    valorEmAberto: roundCurrency(
      contracts.reduce((total, item) => total + item.valor_em_aberto, 0),
    ),
    valorEmAcordo: roundCurrency(
      agreements.reduce((total, item) => total + item.remainingValue, 0),
    ),
    valorPago: roundCurrency(
      payments.reduce((total, item) => total + item.valor_pago, 0),
    ),
    quantidadeContratos: contracts.length,
    acordosAtivos: agreements.filter((item) =>
      ["ativo", "aguardando_pagamento", "parcial", "atrasado"].includes(
        item.resolvedStatus,
      ),
    ).length,
    ultimoPagamento: pickLatestDate(payments.map((item) => item.data_pagamento)),
  } satisfies ClientSummaryCards;
}

function buildClientListRows(
  context: ClientsContext,
  filters: ClientListFilters,
): ClientListRow[] {
  const resolved = buildResolvedCollections(context);

  return context.clients
    .map((client) => {
      const contracts = resolved.contractsByClient.get(client.id) ?? [];
      const agreements = resolved.agreementsByClient.get(client.id) ?? [];
      const payments = resolved.paymentsByClient.get(client.id) ?? [];
      const walletLinks = resolved.walletLinksByClient.get(client.id) ?? [];
      const primaryWalletId =
        walletLinks.find((item) => item.ativo)?.carteira_id ??
        contracts.find((item) => item.carteira_id)?.carteira_id ??
        agreements.find((item) => item.carteira_id)?.carteira_id ??
        null;
      const primaryWallet = primaryWalletId
        ? resolved.walletById.get(primaryWalletId)
        : undefined;
      const operatorId =
        client.operador_id ??
        contracts.find((item) => item.operador_id)?.operador_id ??
        agreements.find((item) => item.operador_id)?.operador_id ??
        null;
      const teamId =
        client.equipe_id ??
        contracts.find((item) => item.equipe_id)?.equipe_id ??
        agreements.find((item) => item.equipe_id)?.equipe_id ??
        null;
      const status = resolveClientStatus(client, contracts, agreements);
      const summary = buildClientSummaryCards(contracts, agreements, payments);
      const lastUpdated = pickLatestDate([
        client.atualizado_em,
        ...contracts.map((item) => item.atualizado_em),
        ...agreements.map((item) => item.atualizado_em),
        ...payments.map((item) => item.criado_em),
      ]);

      return {
        id: client.id,
        nome: client.nome,
        cpfCnpj: client.cpf_cnpj,
        carteira: primaryWallet?.nome ?? getPrimaryWalletLabel(null, null),
        credor:
          primaryWallet?.credor ??
          walletLinks.find((item) => item.ativo)?.credor ??
          contracts.find((item) => item.credor)?.credor ??
          "-",
        equipe: teamId ? resolved.teamById.get(teamId)?.nome ?? "-" : "-",
        operador: operatorId ? resolved.operatorById.get(operatorId)?.nome ?? "-" : "-",
        contratos: contracts.length,
        valorEmAberto: summary.valorEmAberto,
        valorEmAcordo: summary.valorEmAcordo,
        valorPago: summary.valorPago,
        status,
        ultimaAtualizacao: lastUpdated ?? client.atualizado_em,
      } satisfies ClientListRow;
    })
    .filter((row) => {
      const contracts = resolved.contractsByClient.get(row.id) ?? [];
      const operatorId =
        context.clients.find((item) => item.id === row.id)?.operador_id ??
        contracts.find((item) => item.operador_id)?.operador_id ??
        null;
      const teamId =
        context.clients.find((item) => item.id === row.id)?.equipe_id ??
        contracts.find((item) => item.equipe_id)?.equipe_id ??
        null;
      const walletId =
        resolved.walletLinksByClient.get(row.id)?.find((item) => item.ativo)?.carteira_id ??
        contracts.find((item) => item.carteira_id)?.carteira_id ??
        null;
      const contractNumbers = contracts.map((item) => item.numero_contrato);

      return (
        matchesClientSearch(filters.query ?? "", {
          name: row.nome,
          document: row.cpfCnpj,
          contractNumbers,
        }) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.teamId || teamId === filters.teamId) &&
        (!filters.operatorId || operatorId === filters.operatorId) &&
        (!filters.walletId || walletId === filters.walletId) &&
        (!filters.creditor || normalizeText(row.credor) === normalizeText(filters.creditor))
      );
    })
    .sort((left, right) => right.ultimaAtualizacao.localeCompare(left.ultimaAtualizacao));
}

export async function listarClientes(filters: ClientListFilters = {}) {
  const context = await getClientsContext();
  return buildClientListRows(context, filters);
}

export async function buscarClientePorId(clientId: string) {
  const context = await getClientsContext();
  return context.clients.find((item) => item.id === clientId) ?? null;
}

export async function listarContratosCliente(clientId: string) {
  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);
  const agreements = resolved.agreementsByClient.get(clientId) ?? [];
  const payments = resolved.paymentsByClient.get(clientId) ?? [];

  return (resolved.contractsByClient.get(clientId) ?? []).map((contract) => {
    const wallet = contract.carteira_id
      ? resolved.walletById.get(contract.carteira_id)
      : undefined;
    const activeAgreements = agreements.filter(
      (item) =>
        item.contrato_id === contract.id &&
        ["ativo", "aguardando_pagamento", "parcial", "atrasado"].includes(
          item.resolvedStatus,
        ),
    ).length;
    const paidAmount = roundCurrency(
      payments
        .filter((payment) =>
          normalizeText(payment.contrato).includes(normalizeText(contract.numero_contrato)),
        )
        .reduce((total, payment) => total + payment.valor_pago, 0),
    );

    return {
      ...contract,
      carteira: wallet?.nome ?? "-",
      equipe: contract.equipe_id
        ? resolved.teamById.get(contract.equipe_id)?.nome ?? "-"
        : "-",
      operador: contract.operador_id
        ? resolved.operatorById.get(contract.operador_id)?.nome ?? "-"
        : "-",
      acordosAtivos: activeAgreements,
      valorPago: paidAmount,
    } satisfies ClientContractRow;
  });
}

export async function listarAcordosCliente(clientId: string) {
  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);

  return (resolved.agreementsByClient.get(clientId) ?? []).map((agreement) => {
    const wallet = agreement.carteira_id
      ? resolved.walletById.get(agreement.carteira_id)
      : undefined;
    const parcelasPagas = agreement.resolvedInstallments.filter(
      (item) => deriveInstallmentStatus(item) === "pago",
    ).length;
    const parcelasAtrasadas = agreement.resolvedInstallments.filter(
      (item) => deriveInstallmentStatus(item) === "atrasado",
    ).length;
    const parcelasPendentes = agreement.resolvedInstallments.filter(
      (item) => deriveInstallmentStatus(item) === "pendente",
    ).length;

    return {
      ...agreement,
      status: agreement.resolvedStatus,
      carteira: wallet?.nome ?? "-",
      credor: wallet?.credor ?? "-",
      equipe: agreement.equipe_id
        ? resolved.teamById.get(agreement.equipe_id)?.nome ?? "-"
        : "-",
      operador: agreement.operador_id
        ? resolved.operatorById.get(agreement.operador_id)?.nome ?? "-"
        : "-",
      contratoNumero: agreement.contrato ?? "-",
      valorRestante: agreement.remainingValue,
      parcelasPagas,
      parcelasPendentes,
      parcelasAtrasadas,
      parcelas: agreement.resolvedInstallments,
    };
  });
}

export async function listarBaixasCliente(clientId: string) {
  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);
  const agreements = await listarAcordosCliente(clientId);
  const agreementById = new Map(agreements.map((item) => [item.id, item]));

  const writeOffRows = (resolved.writeOffsByClient.get(clientId) ?? []).map((writeOff) => {
    const agreement = agreementById.get(writeOff.acordo_id);
    const installment = agreement?.parcelas.find((item) => item.id === writeOff.parcela_id);
    const registeredBy = writeOff.registrado_por
      ? resolved.profileById.get(writeOff.registrado_por)?.nome ?? "Portal BKO"
      : "Portal BKO";

    return {
      id: writeOff.id,
      acordoId: writeOff.acordo_id,
      parcelaId: writeOff.parcela_id,
      numeroParcela: installment?.numero_parcela ?? 0,
      contrato: agreement?.contratoNumero ?? "-",
      dataPagamento: writeOff.data_pagamento,
      valorPago: writeOff.valor_pago,
      formaPagamento: writeOff.forma_pagamento,
      observacao: writeOff.observacao,
      registradoPor: registeredBy,
      origem: "baixa",
    } satisfies ClientPaymentRow;
  });

  const orphanPayments = (resolved.paymentsByClient.get(clientId) ?? [])
    .filter((payment) => !payment.baixa_id)
    .map((payment) => ({
      id: payment.id,
      acordoId: payment.acordo_id ?? "",
      parcelaId: "",
      numeroParcela: 0,
      contrato: payment.contrato ?? "-",
      dataPagamento: payment.data_pagamento,
      valorPago: payment.valor_pago,
      formaPagamento: payment.origem_arquivo,
      observacao: payment.origem_arquivo,
      registradoPor: "Importacao",
      origem: "pagamento",
    } satisfies ClientPaymentRow));

  return [...writeOffRows, ...orphanPayments].sort((left, right) =>
    right.dataPagamento.localeCompare(left.dataPagamento),
  );
}

export async function getClientesPageData(
  filters: ClientListFilters = {},
): Promise<ClientListPageData> {
  const context = await getClientsContext();

  return {
    profile: context.profile,
    filters,
    options: buildClientFilterOptions(context),
    clients: buildClientListRows(context, filters),
    demoMode: context.demoMode,
  };
}

export async function getClienteDetailPageData(
  clientId: string,
): Promise<ClientDetailPageData | null> {
  const context = await getClientsContext();
  const client = context.clients.find((item) => item.id === clientId);

  if (!client) {
    return null;
  }

  const resolved = buildResolvedCollections(context);
  const contracts = await listarContratosCliente(clientId);
  const agreements = await listarAcordosCliente(clientId);
  const payments = await listarBaixasCliente(clientId);
  const actions = (resolved.actionsByClient.get(clientId) ?? [])
    .map(({ row }) => ({
      ...row,
      operador: row.operador_id
        ? resolved.operatorById.get(row.operador_id)?.nome ?? "-"
        : "-",
      equipe: row.equipe_id ? resolved.teamById.get(row.equipe_id)?.nome ?? "-" : "-",
      carteira: row.carteira_id
        ? resolved.walletById.get(row.carteira_id)?.nome ?? "-"
        : "-",
    }))
    .sort((left, right) => right.data_acionamento.localeCompare(left.data_acionamento)) satisfies ClientActionRow[];
  const summary = buildClientSummaryCards(
    contracts,
    agreements.map((item) => ({
      ...item,
      resolvedStatus: item.status,
      remainingValue: item.valorRestante,
    })),
    (resolved.paymentsByClient.get(clientId) ?? []) as Payment[],
  );

  return {
    profile: context.profile,
    client: {
      ...client,
      status: resolveClientStatus(
        client,
        contracts,
        agreements.map((item) => ({
          ...item,
          resolvedStatus: item.status,
          remainingValue: item.valorRestante,
        })),
      ),
    },
    summary,
    walletLinks: resolved.walletLinksByClient.get(clientId) ?? [],
    contracts,
    agreements,
    payments,
    actions,
    operators: uniqueOptions(
      context.operators.map((operator) => ({
        value: operator.id,
        label: operator.nome,
      })),
    ),
    teams: uniqueOptions(
      context.teams.map((team) => ({
        value: team.id,
        label: team.nome,
      })),
    ),
    wallets: uniqueOptions(
      context.wallets.map((wallet) => ({
        value: wallet.id,
        label: wallet.nome,
        description: wallet.credor,
      })),
    ),
    canCreateAgreement: canCreateAgreements(context.profile.perfil),
    canCancelAgreement: canCancelAgreements(context.profile.perfil),
    canRegisterWriteOff: canRegisterAgreementPayments(context.profile.perfil),
    demoMode: context.demoMode,
  };
}
