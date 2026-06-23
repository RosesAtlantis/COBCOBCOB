import "server-only";

import { getCurrentProfile, requireActiveProfile } from "@/lib/auth";
import {
  getAgreementStatusLabel,
  normalizeText,
} from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { canViewAudit } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import type {
  AuditEvent,
  AuditFilters,
  AuditOrigin,
  AuditPageData,
  FilterOption,
} from "@/types/portal";

import {
  buildResolvedCollections,
  getClientsContext,
  uniqueOptions,
} from "@/services/clientes-service";

type AuditRow = Database["public"]["Tables"]["auditoria_eventos"]["Row"];

export interface CreateAuditEventInput {
  entidade: string;
  entidadeId: string;
  acao: string;
  descricao?: string | null;
  acordoId?: string | null;
  parcelaId?: string | null;
  baixaId?: string | null;
  pagamentoId?: string | null;
  clienteId?: string | null;
  contratoId?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
  carteiraId?: string | null;
  usuarioId?: string | null;
  usuarioNome?: string | null;
  origem?: AuditOrigin | string | null;
  importacaoId?: string | null;
  dadosAnteriores?: Record<string, unknown>;
  dadosNovos?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

function toRecord(value: Json | null | undefined) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

function sortAuditEvents(events: AuditEvent[]) {
  return [...events].sort((left, right) => right.criadoEm.localeCompare(left.criadoEm));
}

function mapAuditRow(row: AuditRow, userNames: Map<string, string>): AuditEvent {
  const payload = toRecord(row.payload);

  return {
    id: row.id,
    entidade: row.entidade,
    entidadeId: row.entidade_id,
    acao: row.acao,
    descricao: row.descricao,
    acordoId: row.acordo_id,
    parcelaId: row.parcela_id,
    baixaId: row.baixa_id,
    pagamentoId: row.pagamento_id,
    clienteId: row.cliente_id,
    contratoId: row.contrato_id,
    operadorId: row.operador_id,
    equipeId: row.equipe_id,
    carteiraId: row.carteira_id,
    usuarioId: row.usuario_id,
    usuarioNome:
      row.usuario_nome ??
      (row.usuario_id ? userNames.get(row.usuario_id) ?? "Portal BKO" : "Portal BKO"),
    dadosAnteriores: toRecord(row.dados_anteriores),
    dadosNovos: toRecord(row.dados_novos),
    payload,
    origem: row.origem,
    importacaoId: row.importacao_id,
    criadoEm: row.criado_em,
  };
}

function buildSearchIndex(
  event: AuditEvent,
  context: Awaited<ReturnType<typeof getClientsContext>>,
) {
  const resolved = buildResolvedCollections(context);
  const client =
    (event.clienteId && resolved.clientById.get(event.clienteId)) ||
    (event.acordoId
      ? resolved.agreementById.get(event.acordoId)?.cliente_id
        ? resolved.clientById.get(resolved.agreementById.get(event.acordoId)?.cliente_id ?? "")
        : undefined
      : undefined);

  return normalizeText(
    [
      event.entidade,
      event.acao,
      event.descricao,
      event.usuarioNome,
      client?.nome,
      client?.cpf_cnpj,
      event.importacaoId,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

async function buildFallbackAuditEventsForAgreement(acordoId: string) {
  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);
  const agreement = resolved.agreementById.get(acordoId);

  if (!agreement) {
    return [] satisfies AuditEvent[];
  }

  const client = agreement.cliente_id
    ? resolved.clientById.get(agreement.cliente_id)
    : undefined;
  const userNames = new Map(context.profiles.map((profile) => [profile.id, profile.nome]));
  const events: AuditEvent[] = [
    {
      id: `fallback-acordo-${agreement.id}`,
      entidade: "acordo",
      entidadeId: agreement.id,
      acao: "acordo_criado",
      descricao: agreement.observacao ?? "Acordo registrado no Portal BKO.",
      acordoId: agreement.id,
      parcelaId: null,
      baixaId: null,
      pagamentoId: null,
      clienteId: agreement.cliente_id,
      contratoId: agreement.contrato_id,
      operadorId: agreement.operador_id,
      equipeId: agreement.equipe_id,
      carteiraId: agreement.carteira_id,
      usuarioId: agreement.criado_por,
      usuarioNome: agreement.criado_por
        ? userNames.get(agreement.criado_por) ?? "Portal BKO"
        : "Portal BKO",
      dadosAnteriores: {},
      dadosNovos: {
        status: agreement.resolvedStatus,
        valorAcordo: agreement.valor_acordo,
        quantidadeParcelas: agreement.resolvedInstallments.length,
      },
      payload: {
        status: agreement.resolvedStatus,
        valorAcordo: agreement.valor_acordo,
        quantidadeParcelas: agreement.resolvedInstallments.length,
      },
      origem: "sistema",
      importacaoId: agreement.importacao_id,
      criadoEm: agreement.criado_em,
    },
  ];

  if (agreement.resolvedStatus !== "ativo") {
    events.push({
      id: `fallback-status-${agreement.id}`,
      entidade: "acordo",
      entidadeId: agreement.id,
      acao: "acordo_status_alterado",
      descricao: `Status atual: ${getAgreementStatusLabel(agreement.resolvedStatus)}.`,
      acordoId: agreement.id,
      parcelaId: null,
      baixaId: null,
      pagamentoId: null,
      clienteId: agreement.cliente_id,
      contratoId: agreement.contrato_id,
      operadorId: agreement.operador_id,
      equipeId: agreement.equipe_id,
      carteiraId: agreement.carteira_id,
      usuarioId: agreement.criado_por,
      usuarioNome: agreement.criado_por
        ? userNames.get(agreement.criado_por) ?? "Portal BKO"
        : "Portal BKO",
      dadosAnteriores: {},
      dadosNovos: {
        status: agreement.resolvedStatus,
        valorPago: agreement.valor_pago,
        saldo: agreement.remainingValue,
      },
      payload: {
        status: agreement.resolvedStatus,
        valorPago: agreement.valor_pago,
        saldo: agreement.remainingValue,
      },
      origem: "sistema",
      importacaoId: agreement.importacao_id,
      criadoEm: agreement.atualizado_em,
    });
  }

  const writeOffs = resolved.resolvedWriteOffs.filter(
    (writeOff) => writeOff.acordo_id === acordoId,
  );

  for (const writeOff of writeOffs) {
    events.push({
      id: `fallback-baixa-${writeOff.id}`,
      entidade: "baixa",
      entidadeId: writeOff.id,
      acao: "baixa_registrada",
      descricao:
        writeOff.forma_pagamento
          ? `Baixa registrada via ${writeOff.forma_pagamento}.`
          : "Baixa registrada no acordo.",
      acordoId: writeOff.acordo_id,
      parcelaId: writeOff.parcela_id,
      baixaId: writeOff.id,
      pagamentoId: null,
      clienteId: writeOff.cliente_id ?? client?.id ?? null,
      contratoId: agreement.contrato_id,
      operadorId: writeOff.operador_id ?? agreement.operador_id,
      equipeId: writeOff.equipe_id ?? agreement.equipe_id,
      carteiraId: agreement.carteira_id,
      usuarioId: writeOff.registrado_por,
      usuarioNome: writeOff.registrado_por
        ? userNames.get(writeOff.registrado_por) ?? "Portal BKO"
        : "Portal BKO",
      dadosAnteriores: {},
      dadosNovos: {
        valorPago: writeOff.valor_pago,
        tipoReceita: writeOff.tipo_receita,
      },
      payload: {
        valorPago: writeOff.valor_pago,
        observacao: writeOff.observacao,
      },
      origem: "baixa",
      importacaoId: writeOff.importacao_id ?? agreement.importacao_id,
      criadoEm: writeOff.criado_em,
    });

    if (writeOff.estornada) {
      events.push({
        id: `fallback-estorno-${writeOff.id}`,
        entidade: "baixa",
        entidadeId: writeOff.id,
        acao: "baixa_estornada",
        descricao: writeOff.motivo_estorno ?? "Baixa estornada manualmente.",
        acordoId: writeOff.acordo_id,
        parcelaId: writeOff.parcela_id,
        baixaId: writeOff.id,
        pagamentoId: null,
        clienteId: writeOff.cliente_id ?? client?.id ?? null,
        contratoId: agreement.contrato_id,
        operadorId: writeOff.operador_id ?? agreement.operador_id,
        equipeId: writeOff.equipe_id ?? agreement.equipe_id,
        carteiraId: agreement.carteira_id,
        usuarioId: writeOff.estornada_por,
        usuarioNome: writeOff.estornada_por
          ? userNames.get(writeOff.estornada_por) ?? "Portal BKO"
          : "Portal BKO",
        dadosAnteriores: {
          valorPago: writeOff.valor_pago,
        },
        dadosNovos: {
          estornada: true,
          motivoEstorno: writeOff.motivo_estorno,
        },
        payload: {
          valorPago: writeOff.valor_pago,
          motivoEstorno: writeOff.motivo_estorno,
        },
        origem: "reversao",
        importacaoId: writeOff.importacao_id ?? agreement.importacao_id,
        criadoEm: writeOff.estornada_em ?? writeOff.criado_em,
      });
    }
  }

  return sortAuditEvents(events);
}

async function buildFallbackAuditEvents() {
  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);
  const allEvents = await Promise.all(
    resolved.resolvedAgreements.map((agreement) =>
      buildFallbackAuditEventsForAgreement(agreement.id),
    ),
  );

  return sortAuditEvents(allEvents.flat());
}

async function loadAuditEvents() {
  const context = await getClientsContext();

  if (!isSupabaseConfigured()) {
    return {
      context,
      events: await buildFallbackAuditEvents(),
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      context,
      events: await buildFallbackAuditEvents(),
    };
  }

  const { data, error } = await supabase
    .from("auditoria_eventos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error || !data) {
    return {
      context,
      events: await buildFallbackAuditEvents(),
    };
  }

  const userNames = new Map(context.profiles.map((profile) => [profile.id, profile.nome]));

  return {
    context,
    events: data.map((row) => mapAuditRow(row, userNames)),
  };
}

function filterAuditEvents(
  events: AuditEvent[],
  context: Awaited<ReturnType<typeof getClientsContext>>,
  filters: AuditFilters,
) {
  return events.filter((event) => {
    const searchIndex = buildSearchIndex(event, context);
    const normalizedQuery = normalizeText(filters.query);
    const matchesQuery = !normalizedQuery || searchIndex.includes(normalizedQuery);
    const matchesEntity = !filters.entity || event.entidade === filters.entity;
    const matchesAction = !filters.action || event.acao === filters.action;
    const matchesUser = !filters.userId || event.usuarioId === filters.userId;
    const matchesImport = !filters.importId || event.importacaoId === filters.importId;
    const matchesStart = !filters.startDate || event.criadoEm.slice(0, 10) >= filters.startDate;
    const matchesEnd = !filters.endDate || event.criadoEm.slice(0, 10) <= filters.endDate;

    return (
      matchesQuery &&
      matchesEntity &&
      matchesAction &&
      matchesUser &&
      matchesImport &&
      matchesStart &&
      matchesEnd
    );
  });
}

function buildAuditOptions(events: AuditEvent[]): {
  entities: FilterOption[];
  actions: FilterOption[];
  users: FilterOption[];
  imports: FilterOption[];
} {
  return {
    entities: uniqueOptions(
      events.map((event) => ({
        value: event.entidade,
        label: event.entidade,
      })),
    ),
    actions: uniqueOptions(
      events.map((event) => ({
        value: event.acao,
        label: event.acao,
      })),
    ),
    users: uniqueOptions(
      events
        .filter((event) => event.usuarioId)
        .map((event) => ({
          value: event.usuarioId ?? "",
          label: event.usuarioNome,
        })),
    ),
    imports: uniqueOptions(
      events
        .filter((event) => event.importacaoId)
        .map((event) => ({
          value: event.importacaoId ?? "",
          label: event.importacaoId ?? "",
        })),
    ),
  };
}

export async function listarHistoricoAcordo(acordoId: string) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);

  if (!acordoId.trim()) {
    return [] satisfies AuditEvent[];
  }

  const { events } = await loadAuditEvents();
  return sortAuditEvents(
    events.filter(
      (event) =>
        event.acordoId === acordoId ||
        (event.entidade === "acordo" && event.entidadeId === acordoId),
    ),
  );
}

export async function listarHistoricoCliente(clienteId: string) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);

  if (!clienteId.trim()) {
    return [] satisfies AuditEvent[];
  }

  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);
  const agreementIds = new Set(
    (resolved.agreementsByClient.get(clienteId) ?? []).map((agreement) => agreement.id),
  );
  const contractIds = new Set(
    (resolved.contractsByClient.get(clienteId) ?? []).map((contract) => contract.id),
  );
  const { events } = await loadAuditEvents();

  return sortAuditEvents(
    events.filter(
      (event) =>
        event.clienteId === clienteId ||
        (event.contratoId ? contractIds.has(event.contratoId) : false) ||
        (event.acordoId ? agreementIds.has(event.acordoId) : false),
    ),
  );
}

export async function listarAuditoria(filters: AuditFilters = {}) {
  const profile = await requireActiveProfile([
    "admin",
    "gerente",
    "supervisor",
    "financeiro",
  ]);

  if (!canViewAudit(profile.perfil)) {
    return [] satisfies AuditEvent[];
  }

  const { context, events } = await loadAuditEvents();
  return sortAuditEvents(filterAuditEvents(events, context, filters));
}

export async function getAuditoriaPageData(
  filters: AuditFilters = {},
): Promise<AuditPageData> {
  const profile = await requireActiveProfile([
    "admin",
    "gerente",
    "supervisor",
    "financeiro",
  ]);
  const { context, events } = await loadAuditEvents();
  const filteredEvents = filterAuditEvents(events, context, filters);

  return {
    profile,
    filters,
    options: buildAuditOptions(events),
    events: sortAuditEvents(filteredEvents),
    demoMode: context.demoMode,
  };
}

export async function registrarAuditoria(input: CreateAuditEventInput) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);

  if (!isSupabaseConfigured()) {
    return {
      id: `demo-auditoria-${Date.now()}`,
      demoMode: true,
    };
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: `demo-auditoria-${Date.now()}`,
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("auditoria_eventos")
    .insert({
      entidade: input.entidade,
      entidade_id: input.entidadeId,
      acao: input.acao,
      descricao: input.descricao ?? null,
      acordo_id: input.acordoId ?? null,
      parcela_id: input.parcelaId ?? null,
      baixa_id: input.baixaId ?? null,
      pagamento_id: input.pagamentoId ?? null,
      cliente_id: input.clienteId ?? null,
      contrato_id: input.contratoId ?? null,
      operador_id: input.operadorId ?? null,
      equipe_id: input.equipeId ?? null,
      carteira_id: input.carteiraId ?? null,
      usuario_id: input.usuarioId ?? profile?.id ?? null,
      usuario_nome: input.usuarioNome ?? profile?.nome ?? "Portal BKO",
      dados_anteriores: (input.dadosAnteriores ?? {}) as Json,
      dados_novos: (input.dadosNovos ?? {}) as Json,
      origem: input.origem ?? "manual",
      importacao_id: input.importacaoId ?? null,
      payload: (input.payload ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel registrar o evento de auditoria.");
  }

  return {
    id: data.id,
    demoMode: false,
  };
}

export { registrarAuditoria as criarEventoAuditoria };
